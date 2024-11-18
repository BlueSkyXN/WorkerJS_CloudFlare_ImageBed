"""
  Authorization需要你注册登录 https://www.freebuf.com/ 获取，有效期不详，也许是一个月
"""

import requests
import os
import json
import mimetypes
import re

def upload_image_to_freebuf(file_path, authorization_token):
    """
    上传图片到 Freebuf 图床接口并返回图片的 URL（不使用 Cookie）。
    
    :param file_path: 要上传的图片的本地路径
    :param authorization_token: Authorization Bearer Token
    :return: 上传后的图片 URL 或错误信息
    """
    upload_url = "https://www.freebuf.com/fapi/frontend/upload/image"
    
    # 检查文件是否存在
    if not os.path.isfile(file_path):
        print(f"文件不存在: {file_path}")
        return
    
    # 检查文件类型
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type not in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
        print("不支持的文件类型。仅支持 PNG, JPEG, GIF, WEBP。")
        return
    
    # 打开文件
    with open(file_path, 'rb') as f:
        # 准备 multipart/form-data 的文件部分
        files = {
            'file': (os.path.basename(file_path), f, mime_type)
        }
        
        # 准备表单数据
        data = {
            'is_base64': '0'
        }
        
        # 准备请求头
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
            "Authorization": f"Bearer {authorization_token}",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Referer": "https://www.freebuf.com/write",
            "DNT": "1",
            "Origin": "https://www.freebuf.com",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "X-Client-Type": "web",
            "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            # 不需要手动设置 "Content-Type"，requests 会自动处理
        }
        
        try:
            # 发送 POST 请求
            response = requests.post(upload_url, headers=headers, files=files, data=data)
            
            # 检查响应状态码
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    print("响应 JSON 内容:", json.dumps(response_data, indent=2, ensure_ascii=False))  # 打印响应内容
                    
                    # 检查响应结构
                    if response_data.get('code') == 200 and response_data.get('data', {}).get('status'):
                        image_url = response_data['data'].get('url', '')
                        # 清理 URL
                        image_url = re.sub(r'\\', '', image_url).replace('!small', '')
                        image_url = re.sub(r'^https?:', 'https:', image_url)
                        image_url = re.sub(r'([^:]\/)\/+', r'\1', image_url)
                        print(f"图片上传成功: {image_url}")
                    else:
                        print(f"上传失败，消息: {response_data.get('msg', '未知错误')}")
                except json.JSONDecodeError:
                    print("响应不是有效的 JSON 格式。")
            else:
                print(f"上传失败。状态码: {response.status_code}")
                print(f"响应内容: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"请求过程中出现错误: {e}")

if __name__ == '__main__':
    # 本地图片路径
    file_path = r'F:\Download\test.jpg'  # 使用原始字符串以处理反斜杠
    
    # 替换为您的实际 Authorization Token
    authorization_token = "ey"
    
    upload_image_to_freebuf(file_path, authorization_token)
