#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AlltoMD - 全能文件转Markdown工具
通过Cloudflare Workers AI的toMarkdown API将各种格式的文件转换为Markdown
支持格式: PDF, 图像(JPEG/PNG/WEBP/SVG), HTML, XML, MS Office文档, ODS, CSV, Apple Numbers等
"""

import argparse
import base64
import concurrent.futures
import json
import logging
import mimetypes
import os
import re
import sys
import time
from typing import Dict, List, Optional, Tuple, Union

import requests
from tqdm import tqdm

# 设置日志格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("AlltoMD")

# 预定义的Cloudflare账号ID和API令牌（可以被命令行参数覆盖）
DEFAULT_ACCOUNT_ID = "your_account_id"
DEFAULT_API_TOKEN = "your_api_token"

# 支持的文件格式和对应的MIME类型 - 精确匹配Cloudflare文档中的表格
SUPPORTED_FORMATS = {
    # PDF文档
    ".pdf": "application/pdf",
    
    # 图像文件
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    
    # HTML文档
    ".html": "text/html",
    
    # XML文档
    ".xml": "application/xml",
    
    # Microsoft Office文档
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xlsm": "application/vnd.ms-excel.sheet.macroenabled.12",
    ".xlsb": "application/vnd.ms-excel.sheet.binary.macroenabled.12",
    ".xls": "application/vnd.ms-excel",
    ".et": "application/vnd.ms-excel",
    
    # Open Document格式
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    
    # CSV文件
    ".csv": "text/csv",
    
    # Apple文档
    ".numbers": "application/vnd.apple.numbers"
}

class CloudflareMarkdownConverter:
    """Cloudflare toMarkdown API封装类"""
    
    def __init__(self, account_id: str, api_token: str, max_retries: int = 3, retry_delay: int = 2, 
                 http_proxy: Optional[str] = None, https_proxy: Optional[str] = None, 
                 socks5_proxy: Optional[str] = None):
        """
        初始化转换器
        
        参数:
            account_id (str): Cloudflare账号ID
            api_token (str): Cloudflare API令牌
            max_retries (int): 最大重试次数
            retry_delay (int): 重试延迟(秒)
            http_proxy (str, optional): HTTP代理地址，格式为 "http://用户名:密码@主机:端口"
            https_proxy (str, optional): HTTPS代理地址，格式为 "http://用户名:密码@主机:端口"
            socks5_proxy (str, optional): SOCKS5代理地址，格式为 "主机:端口" 或 "用户名:密码@主机:端口"
        """
        self.account_id = account_id
        self.api_token = api_token
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.base_url = "https://api.cloudflare.com/client/v4/accounts"
        self.api_endpoint = f"{self.base_url}/{self.account_id}/ai/tomarkdown"
        
        # 配置代理
        self.proxies = {}
        if http_proxy:
            self.proxies['http'] = http_proxy
        if https_proxy:
            self.proxies['https'] = https_proxy
        if socks5_proxy:
            # 确保SOCKS5代理地址格式正确
            if not socks5_proxy.startswith('socks5://'):
                # 检查是否包含用户名和密码
                if '@' in socks5_proxy:
                    auth, addr = socks5_proxy.split('@', 1)
                    socks5_proxy = f"socks5://{auth}@{addr}"
                else:
                    socks5_proxy = f"socks5://{socks5_proxy}"
            # 同时设置HTTP和HTTPS，都通过SOCKS5代理
            self.proxies['http'] = socks5_proxy
            self.proxies['https'] = socks5_proxy
        
        # 验证API凭证
        self._verify_credentials()
    
    def _verify_credentials(self) -> bool:
        """验证Cloudflare API凭证是否有效"""
        try:
            # 使用账号API查询接口验证凭证有效性
            response = requests.get(
                f"{self.base_url}/{self.account_id}",
                headers=self._get_headers(),
                proxies=self.proxies
            )
            
            if response.status_code == 200:
                logger.info("Cloudflare API凭证验证成功")
                return True
            else:
                logger.warning(f"Cloudflare API凭证验证失败: {response.status_code}")
                return False
                
        except Exception as e:
            logger.warning(f"凭证验证过程中发生错误: {str(e)}")
            return False
    
    def _get_headers(self, for_multipart=False) -> Dict[str, str]:
        """
        获取API请求头
        
        参数:
            for_multipart (bool): 是否用于multipart/form-data请求
        
        返回:
            Dict[str, str]: 请求头字典
        """
        headers = {
            "Authorization": f"Bearer {self.api_token}"
        }
        
        # 对于JSON请求需要设置Content-Type，但对于multipart/form-data请求，
        # requests库会自动设置正确的Content-Type和boundary
        if not for_multipart:
            headers["Content-Type"] = "application/json"
            
        return headers
    
    def convert_file(self, file_path: str) -> Optional[str]:
        """
        将单个文件转换为Markdown
        
        参数:
            file_path (str): 文件路径
            
        返回:
            Optional[str]: 转换后的Markdown内容，失败则返回None
        """
        if not os.path.exists(file_path):
            logger.error(f"文件不存在: {file_path}")
            return None
        
        # 检查文件是否为支持的格式
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in SUPPORTED_FORMATS:
            logger.warning(f"不支持的文件格式: {file_ext} ({file_path})")
            return None
        
        # 获取MIME类型
        mime_type = SUPPORTED_FORMATS.get(file_ext)
        if not mime_type:
            mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        
        # 获取文件大小并记录日志
        file_size = os.path.getsize(file_path) / (1024 * 1024)  # 转换为MB
        logger.debug(f"文件大小: {file_size:.2f} MB")
        
        # 如果文件过大，提供警告
        if file_size > 50:
            logger.warning(f"文件较大 ({file_size:.2f} MB)，可能会导致上传超时")
        
        # 准备API请求 - 使用multipart/form-data格式
        file_name = os.path.basename(file_path)
        
        # 带重试的API调用
        for attempt in range(self.max_retries):
            try:
                logger.debug(f"正在转换文件 {file_path} (尝试 {attempt+1}/{self.max_retries})")
                
                # 使用multipart/form-data格式上传文件
                with open(file_path, 'rb') as f:
                    files = {
                        'files': (file_name, f, mime_type)
                    }
                    
                    # 使用固定的宽裕超时设置 - 默认设置不依赖任何参数
                    timeout_setting = (60, 600)  # 连接超时60秒，读取超时600秒（10分钟）
                    
                    logger.debug(f"使用超时设置: 连接={timeout_setting[0]}秒, 读取={timeout_setting[1]}秒")
                    
                    # 简单记录文件大小，但不做任何限制
                    if file_size > 100:
                        logger.info(f"处理大文件 ({file_size:.2f} MB)，可能需要更长时间")
                    
                    # 使用标准上传方式
                    with open(file_path, 'rb') as f:
                        files = {'files': (file_name, f, mime_type)}
                        response = requests.post(
                            self.api_endpoint,
                            headers=self._get_headers(for_multipart=True),
                            files=files,
                            proxies=self.proxies,
                            timeout=timeout_setting
                        )
                
                # 检查响应状态
                if response.status_code == 200:
                    result = response.json()
                    
                    # 检查结果中是否有数据
                    if result and 'result' in result and result['result']:
                        # 根据响应格式提取数据
                        if isinstance(result['result'], list) and len(result['result']) > 0:
                            return result['result'][0]['data']
                        elif isinstance(result['result'], dict) and 'data' in result['result']:
                            return result['result']['data']
                        else:
                            logger.warning(f"API返回了未预期的结果格式: {result}")
                            return None
                    else:
                        logger.warning(f"API返回了空结果: {file_path}")
                        return None
                        
                elif response.status_code == 413:
                    logger.error(f"API拒绝请求：文件太大 (HTTP 413)")
                    logger.debug(f"响应内容: {response.text}")
                    # 文件太大错误通常无法通过重试解决
                    break
                    
                elif response.status_code >= 500:
                    logger.error(f"API服务器错误: HTTP状态码 {response.status_code}")
                    logger.debug(f"响应内容: {response.text}")
                    # 服务器错误，需要重试
                    time.sleep(self.retry_delay * (attempt + 1))
                    
                else:
                    logger.error(f"API调用失败: HTTP状态码 {response.status_code}")
                    logger.debug(f"响应内容: {response.text}")
                    
                    # 如果是客户端错误，并且不是临时的，不再重试
                    if response.status_code >= 400 and response.status_code < 500:
                        break
                    
                    # 等待后重试
                    time.sleep(self.retry_delay * (attempt + 1))
                
            except requests.exceptions.Timeout as e:
                logger.error(f"请求超时: {str(e)}")
                # 对于超时错误，增加等待时间再重试
                wait_time = self.retry_delay * (attempt + 2)
                logger.info(f"等待 {wait_time} 秒后重试...")
                time.sleep(wait_time)
                
            except requests.exceptions.ConnectionError as e:
                logger.error(f"连接错误: {str(e)}")
                # 检查是否与代理相关
                if "proxy" in str(e).lower():
                    logger.warning("可能是代理服务器问题，请检查代理配置或使用--timeout参数增加超时时间")
                # 对于连接错误，增加等待时间再重试
                wait_time = self.retry_delay * (attempt + 2)
                logger.info(f"等待 {wait_time} 秒后重试...")
                time.sleep(wait_time)
                
            except Exception as e:
                logger.error(f"API调用过程中发生错误: {str(e)}")
                time.sleep(self.retry_delay * (attempt + 1))
        
        logger.error(f"转换失败 (已重试 {self.max_retries} 次): {file_path}")
        return None
    
    def convert_and_save(self, file_path: str, output_path: Optional[str] = None) -> bool:
        """
        转换文件并保存结果
        
        参数:
            file_path (str): 文件路径
            output_path (str, optional): 输出文件路径，默认为None（与输入文件同名但扩展名为.md）
            
        返回:
            bool: 操作是否成功
        """
        # 设置默认输出路径
        if output_path is None:
            base_path = os.path.splitext(file_path)[0]
            output_path = f"{base_path}.md"
            
        # 创建输出目录（如果不存在）
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # 转换文件
        markdown_content = self.convert_file(file_path)
        
        if markdown_content:
            try:
                # 保存Markdown内容到文件
                with open(output_path, 'w', encoding='utf-8') as md_file:
                    md_file.write(markdown_content)
                logger.info(f"已保存: {output_path}")
                return True
            except Exception as e:
                logger.error(f"保存文件失败 {output_path}: {str(e)}")
                return False
        else:
            return False


class AlltoMD:
    """AlltoMD主类，处理命令行参数和执行转换任务"""
    
    def __init__(self):
        self.parser = self._create_parser()
        self.args = None
        self.converter = None
    
    def _create_parser(self) -> argparse.ArgumentParser:
        """创建命令行参数解析器"""
        parser = argparse.ArgumentParser(
            description='AlltoMD - 全能文件转Markdown工具',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
支持的文件格式 (基于Cloudflare官方文档):
  * PDF文档 (.pdf)
  * 图像文件 (.jpeg, .jpg, .png, .webp, .svg)
  * HTML文档 (.html)
  * XML文档 (.xml)
  * Microsoft Office Excel文档 (.xlsx, .xlsm, .xlsb, .xls, .et)
  * Open Document电子表格 (.ods)
  * CSV文件 (.csv)
  * Apple Numbers文档 (.numbers)
            """
        )
        
        # 输入输出参数
        parser.add_argument('input', help='输入文件或目录路径')
        parser.add_argument('-o', '--output', help='输出文件或目录路径（默认与输入同名但扩展名为.md）')
        
        # Cloudflare API参数
        parser.add_argument('-a', '--account-id', default=DEFAULT_ACCOUNT_ID, 
                           help='Cloudflare账号ID')
        parser.add_argument('-t', '--api-token', default=DEFAULT_API_TOKEN, 
                           help='Cloudflare API令牌')
        
        # 目录处理参数
        parser.add_argument('-r', '--recursive', action='store_true', 
                           help='递归处理子目录（当输入为目录时）')
        parser.add_argument('-p', '--preserve-structure', action='store_true', 
                           help='保留目录结构（当输入为目录且有指定输出目录时）')
        
        # 格式过滤参数
        parser.add_argument('-i', '--include', 
                           help='仅包含指定的扩展名，多个扩展名用逗号分隔（例如: -i .pdf,.html）')
        parser.add_argument('-e', '--exclude', 
                           help='排除指定的扩展名，多个扩展名用逗号分隔（例如: -e .jpg,.png）')
        
        # 性能参数
        parser.add_argument('-j', '--jobs', type=int, default=4, 
                           help='并行处理的任务数（默认: 4）')
        parser.add_argument('--retry', type=int, default=3, 
                           help='API调用失败时的最大重试次数（默认: 3）')
        parser.add_argument('--retry-delay', type=int, default=2, 
                           help='重试之间的延迟秒数（默认: 2）')
        
        # 代理参数
        parser.add_argument('--http-proxy', 
                           help='HTTP代理，格式为 "http://用户名:密码@主机:端口" 或 "http://主机:端口"')
        parser.add_argument('--https-proxy', 
                           help='HTTPS代理，格式为 "http://用户名:密码@主机:端口" 或 "http://主机:端口"')
        parser.add_argument('--socks5-proxy', 
                           help='SOCKS5代理，格式为 "用户名:密码@主机:端口" 或 "主机:端口"')
        
        # 其他参数
        parser.add_argument('-v', '--verbose', action='store_true', 
                           help='启用详细日志输出')
        parser.add_argument('-q', '--quiet', action='store_true', 
                           help='仅显示错误和警告信息')
        parser.add_argument('--no-progress', action='store_true', 
                           help='不显示进度条')
        
        return parser
    
    def parse_args(self, args=None):
        """解析命令行参数"""
        self.args = self.parser.parse_args(args)
        
        # 设置日志级别
        if self.args.verbose:
            logger.setLevel(logging.DEBUG)
        elif self.args.quiet:
            logger.setLevel(logging.WARNING)
        
        # 初始化转换器
        self.converter = CloudflareMarkdownConverter(
            account_id=self.args.account_id,
            api_token=self.args.api_token,
            max_retries=self.args.retry,
            retry_delay=self.args.retry_delay,
            http_proxy=self.args.http_proxy,
            https_proxy=self.args.https_proxy,
            socks5_proxy=self.args.socks5_proxy
        )
        
        return self.args
    
    def get_files_to_process(self) -> List[Tuple[str, str]]:
        """
        获取需要处理的文件列表及其输出路径
        
        返回:
            List[Tuple[str, str]]: (输入文件路径, 输出文件路径)的列表
        """
        input_path = self.args.input
        output_path = self.args.output
        
        # 解析包含和排除的扩展名
        include_extensions = None
        if self.args.include:
            include_extensions = [ext.strip().lower() for ext in self.args.include.split(',')]
            # 确保所有扩展名都以.开头
            include_extensions = [ext if ext.startswith('.') else f".{ext}" for ext in include_extensions]
        
        exclude_extensions = []
        if self.args.exclude:
            exclude_extensions = [ext.strip().lower() for ext in self.args.exclude.split(',')]
            # 确保所有扩展名都以.开头
            exclude_extensions = [ext if ext.startswith('.') else f".{ext}" for ext in exclude_extensions]
        
        files_to_process = []
        
        # 处理单个文件
        if os.path.isfile(input_path):
            # 检查文件扩展名是否符合条件
            file_ext = os.path.splitext(input_path)[1].lower()
            
            # 跳过不符合条件的文件
            if file_ext not in SUPPORTED_FORMATS:
                logger.warning(f"不支持的文件格式: {file_ext} ({input_path})")
                return []
                
            if include_extensions and file_ext not in include_extensions:
                logger.info(f"跳过不包含的扩展名: {input_path}")
                return []
                
            if file_ext in exclude_extensions:
                logger.info(f"跳过排除的扩展名: {input_path}")
                return []
            
            # 确定输出文件路径
            if output_path:
                # 如果指定的输出路径是目录，将输出文件放在该目录下
                if os.path.isdir(output_path) or output_path.endswith('/') or output_path.endswith('\\'):
                    os.makedirs(output_path, exist_ok=True)
                    output_file = os.path.join(output_path, f"{os.path.splitext(os.path.basename(input_path))[0]}.md")
                else:
                    output_file = output_path
            else:
                # 默认输出路径：与输入文件同名但扩展名为.md
                output_file = f"{os.path.splitext(input_path)[0]}.md"
            
            files_to_process.append((input_path, output_file))
        
        # 处理目录
        elif os.path.isdir(input_path):
            # 确定输出目录
            output_dir = output_path if output_path else input_path
            
            # 遍历目录
            for root, _, files in os.walk(input_path):
                # 如果不递归处理子目录，只处理顶层目录
                if not self.args.recursive and root != input_path:
                    continue
                
                for file in files:
                    file_path = os.path.join(root, file)
                    file_ext = os.path.splitext(file)[1].lower()
                    
                    # 跳过不符合条件的文件
                    if file_ext not in SUPPORTED_FORMATS:
                        continue
                        
                    if include_extensions and file_ext not in include_extensions:
                        continue
                        
                    if file_ext in exclude_extensions:
                        continue
                    
                    # 确定输出文件路径
                    if self.args.preserve_structure and output_path:
                        # 保留目录结构
                        rel_path = os.path.relpath(root, input_path)
                        output_subdir = os.path.join(output_dir, rel_path)
                        os.makedirs(output_subdir, exist_ok=True)
                        output_file = os.path.join(output_subdir, f"{os.path.splitext(file)[0]}.md")
                    else:
                        # 所有输出文件放在同一目录下
                        if output_path:
                            os.makedirs(output_path, exist_ok=True)
                            output_file = os.path.join(output_path, f"{os.path.splitext(file)[0]}.md")
                        else:
                            output_file = os.path.join(root, f"{os.path.splitext(file)[0]}.md")
                    
                    files_to_process.append((file_path, output_file))
        
        else:
            logger.error(f"输入路径不存在: {input_path}")
        
        return files_to_process
    
    def process_files(self):
        """处理所有文件"""
        # 获取需要处理的文件列表
        files_to_process = self.get_files_to_process()
        
        if not files_to_process:
            logger.warning("没有找到可处理的文件")
            return False
        
        logger.info(f"找到 {len(files_to_process)} 个文件需要处理")
        
        # 创建进度条
        pbar = None
        if not self.args.no_progress:
            pbar = tqdm(total=len(files_to_process), desc="转换进度")
        
        # 统计成功和失败的文件数
        successful = 0
        failed = 0
        
        # 确定并行任务数量
        jobs = min(self.args.jobs, len(files_to_process))
        logger.debug(f"使用 {jobs} 个并行任务处理 {len(files_to_process)} 个文件")
        
        # 使用线程池并行处理文件
        with concurrent.futures.ThreadPoolExecutor(max_workers=jobs) as executor:
            # 提交所有任务
            future_to_file = {
                executor.submit(self.converter.convert_and_save, input_file, output_file): (input_file, output_file)
                for input_file, output_file in files_to_process
            }
            
            # 处理完成的任务结果
            for future in concurrent.futures.as_completed(future_to_file):
                input_file, output_file = future_to_file[future]
                
                try:
                    result = future.result()
                    
                    if result:
                        successful += 1
                    else:
                        failed += 1
                        logger.error(f"转换失败: {input_file}")
                        
                except Exception as e:
                    failed += 1
                    logger.error(f"处理文件时发生错误 {input_file}: {str(e)}")
                
                # 更新进度条
                if pbar:
                    pbar.update(1)
        
        # 关闭进度条
        if pbar:
            pbar.close()
        
        # 输出统计信息
        logger.info(f"转换完成: 成功 {successful} 个文件, 失败 {failed} 个文件")
        
        return failed == 0
    
    def run(self, args=None):
        """运行程序"""
        self.parse_args(args)
        return self.process_files()


def main():
    """主函数"""
    try:
        app = AlltoMD()
        success = app.run()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.warning("用户中断，正在退出...")
        sys.exit(130)
    except Exception as e:
        logger.error(f"发生未处理的异常: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
