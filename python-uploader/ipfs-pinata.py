import requests
import json
import argparse
import os
import mimetypes
from requests_toolbelt.multipart.encoder import MultipartEncoder

# 硬编码JWT令牌
JWT = ""

def pin_file_to_ipfs(file_path):
    # 解析绝对路径
    file_path = os.path.abspath(file_path)
    
    if not os.path.isfile(file_path):
        print(f"错误: 文件 '{file_path}' 不存在或不是一个文件。")
        return

    # 获取文件名
    file_name = os.path.basename(file_path)

    # 手动添加对较新格式的 MIME 类型支持（如 .avif）
    mimetypes.add_type('image/avif', '.avif')
    mimetypes.add_type('video/webm', '.webm')  # 其他可能需要的类型

    # 使用 mimetypes 通过扩展名识别 MIME 类型
    mime_type, _ = mimetypes.guess_type(file_path)

    # 如果 MIME 类型无法识别，设置为'application/octet-stream'
    if mime_type is None:
        mime_type = 'application/octet-stream'

    try:
        with open(file_path, 'rb') as file:
            # 使用 multipart form data 传递文件和 MIME 类型
            form_data = MultipartEncoder(
                fields={
                    'file': (file_name, file, mime_type),
                    'pinataMetadata': json.dumps({
                        'name': file_name
                    }),
                    'pinataOptions': json.dumps({
                        'cidVersion': 0
                    })
                }
            )

            # 设置请求头，确保 JWT 和 Content-Type 正确传递
            headers = {
                'Authorization': f'Bearer {JWT}',
                'Content-Type': form_data.content_type
            }

            print(f"正在上传文件 '{file_name}'，MIME类型: {mime_type}...")

            # 向 Pinata 发起 POST 请求上传文件
            response = requests.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data=form_data,
                headers=headers
            )

            if response.status_code == 200:
                response_json = response.json()
                ipfs_hash = response_json["IpfsHash"]
                ipfs_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
                
                print("文件成功上传至IPFS！")
                print(json.dumps(response_json, indent=4))
                print(f"可访问的IPFS URL: {ipfs_url}")
            else:
                print(f"上传失败。状态码: {response.status_code}")
                print(f"响应内容: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
    except Exception as e:
        print(f"发生错误: {e}")

def main():
    parser = argparse.ArgumentParser(description="将文件上传到Pinata的IPFS。")
    parser.add_argument('file_path', type=str, help='要上传的文件的路径')

    args = parser.parse_args()

    # 处理中文路径和空格，确保编码正确
    try:
        pin_file_to_ipfs(args.file_path)
    except Exception as e:
        print(f"上传时发生错误: {e}")

if __name__ == "__main__":
    main()
