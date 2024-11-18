import requests
import uuid
import os
import urllib.parse

def generate_uuid_filename(original_filename):
    """
    生成一个基于 UUID 的随机文件名，保留原始文件的扩展名。
    """
    _, ext = os.path.splitext(original_filename)
    unique_id = str(uuid.uuid4())
    new_filename = f"{unique_id}{ext}"
    return new_filename

def upload_file(upload_url, base_url, authorization_token, file_path):
    """
    上传文件并返回可访问的文件 URL。
    
    参数:
    - upload_url: 文件上传的 API 端点
    - base_url: 构建文件可访问 URL 的基础地址
    - authorization_token: 用于 API 认证的令牌
    - file_path: 本地文件的路径
    
    返回:
    - file_url: 上传后文件的可访问链接
    """
    if not os.path.isfile(file_path):
        print(f"错误: 文件 '{file_path}' 不存在。")
        return None

    # 获取原始文件名
    original_filename = os.path.basename(file_path)
    # 生成随机文件名
    new_filename = generate_uuid_filename(original_filename)
    
    # 设置请求头
    headers = {
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
        'Authorization': f'UCloud {authorization_token}',
        'Cache-Control': 'no-cache',
        'DNT': '1',
        'Origin': 'chrome-extension://dckaeinoeaogebmhijpkpmacifmpgmcb',
        'Pragma': 'no-cache',
        'Priority': 'u=1, i',
        'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'none',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
    }

    # 根据文件扩展名设置 MIME 类型
    mime_type = 'image/jpeg' if new_filename.lower().endswith('.jpg') or new_filename.lower().endswith('.jpeg') else 'image/png'

    # 准备文件数据
    files = {
        'file': (new_filename, open(file_path, 'rb'), mime_type)
    }

    try:
        response = requests.post(upload_url, headers=headers, files=files)
    except requests.exceptions.RequestException as e:
        print(f"文件上传过程中发生网络错误: {e}")
        return None
    finally:
        # 确保文件关闭
        files['file'][1].close()

    # 检查响应状态码
    if response.status_code != 200:
        print(f"上传失败，HTTP 状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        return None

    # 解析 JSON 响应
    try:
        data = response.json()
    except ValueError:
        print("无法解析响应为 JSON 格式。")
        print(f"响应内容: {response.text}")
        return None

    # 检查 RetCode
    ret_code = data.get('RetCode')
    if ret_code != 1:
        print(f"上传失败，RetCode: {ret_code}")
        print(f"响应内容: {data}")
        return None

    # 获取文件名
    files_list = data.get('Files', [])
    if not files_list:
        print("响应中未包含文件信息。")
        return None

    uploaded_filename = files_list[0]

    # URL 编码文件名
    encoded_filename = urllib.parse.quote(uploaded_filename)

    # 构建完整的文件 URL
    file_url = f"{base_url}{encoded_filename}"

    return file_url

def main():
    # 配置参数
    upload_url = 'https://spt.ucloud.cn/im/client/upload'
    base_url = 'https://uchat.cn-bj.ufileos.com/'
    authorization_token = 'TOKEN_12134567890'  # 替换为你的实际令牌
    file_path = r'F:\Download\test.jpg'  # 要上传的本地文件路径

    # 上传文件
    file_url = upload_file(upload_url, base_url, authorization_token, file_path)

    if file_url:
        print(f"文件上传成功！可访问链接: {file_url}")
    else:
        print("文件上传失败。")

if __name__ == "__main__":
    main()
