import requests

# 设置 API 上传 URL
url = "https://api.tingquanxunbao.com/api/v1/file/upload"

# 设置请求头，假设需要 `Authorization` token，可以根据需要添加更多头信息
headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',  # 替换为实际的 token，如果不需要认证可以去掉此行
}

# 文件路径和类型
file_path = r"F:\Download\20240707-204330.jpg"
file_type = 'image'

# 打开图片文件并上传
with open(file_path, 'rb') as file:
    files = {
        'file': file,  # 文件字段
    }
    data = {
        'file_type': file_type,  # 文件类型字段
    }

    # 发起 POST 请求上传文件
    response = requests.post(url, headers=headers, files=files, data=data)

# 检查响应
if response.status_code == 200:
    print("文件上传成功:", response.json())
else:
    print("文件上传失败，状态码:", response.status_code)
    print("响应内容:", response.text)
