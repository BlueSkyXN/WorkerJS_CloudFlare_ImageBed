#!/usr/bin/env python3
"""
IPFS 图床上传测试脚本
直接测试 IPFS 原始接口 https://api.img2ipfs.org/api/v0/add?pin=false
检查该接口在当前环境下是否可用
"""

import requests
import json

# 配置项
IMAGE_PATH = "/Volumes/TP4000PRO/20251023-092722.jpeg"  # 测试图片路径
IPFS_API_URL = "https://api.img2ipfs.org/api/v0/add?pin=false"  # IPFS 原始接口

def upload_to_ipfs(file_path: str, api_url: str = IPFS_API_URL):
    """
    上传图片到 IPFS 原始接口
    :param file_path: 本地文件路径
    :param api_url: IPFS API 地址
    :return: 响应的 IPFS 图片链接
    """
    try:
        # 打开图片文件
        with open(file_path, 'rb') as f:
            # 使用 multipart/form-data 发送文件，字段名为 'file'（根据JS代码）
            files = {
                'file': f
            }

            # 设置请求头
            headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
            }

            # 发送 POST 请求
            print(f"正在上传文件到 IPFS 原始接口: {api_url}")
            response = requests.post(api_url, files=files, headers=headers)

        # 打印响应状态码
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")

        # 检查响应
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"JSON 响应: {json.dumps(result, indent=2, ensure_ascii=False)}")

                # 检查是否有错误代码（API 返回 200 但内部错误）
                if 'code' in result and result['code'] != 200:
                    print(f"\n✗ API 返回错误！")
                    print(f"错误代码: {result.get('code')}")
                    print(f"错误信息: {result.get('msg', '未知错误')}")
                    return None

                # 从返回结果中提取信息
                file_name = result.get('Name', '')
                file_hash = result.get('Hash', '')
                file_size = result.get('Size', '')

                # 验证必要字段
                if not file_hash:
                    print(f"\n✗ 响应缺少必要的 Hash 字段")
                    return None

                print(f"\n✓ 上传成功！")
                print(f"文件名: {file_name}")
                print(f"哈希值: {file_hash}")
                print(f"大小: {file_size} 字节")

                # 构建图片访问链接（根据JS代码逻辑）
                access_url = f"https://ipfs.io/ipfs/{file_hash}"
                print(f"IPFS 访问链接: {access_url}")

                return access_url

            except json.JSONDecodeError:
                print(f"响应不是 JSON 格式")
                print(f"原始响应内容: {response.text}")
                return None
        else:
            print(f"上传失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None

    except FileNotFoundError:
        print(f"错误: 文件未找到 - {file_path}")
        return None
    except Exception as e:
        print(f"发生错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print('=' * 60)
    print('开始测试 IPFS 原始接口')
    print(f'测试图片: {IMAGE_PATH}')
    print(f'IPFS 接口: {IPFS_API_URL}')
    print('=' * 60)
    print()

    result = upload_to_ipfs(IMAGE_PATH)

    print()
    print('=' * 60)
    if result:
        print('✓ 测试成功！IPFS 接口在当前环境下可用')
        print(f'✓ 最终链接: {result}')
    else:
        print('✗ 测试失败！IPFS 接口在当前环境下不可用')
    print('=' * 60)
