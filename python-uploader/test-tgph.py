import requests

# 图片上传接口的URL（与JS代码中一致）
upload_url = "https://telegra.ph/upload?source=bugtracker"

# 要上传的图片路径
image_path = r"F:\Download\20240707-204330.jpg"

# 读取图片文件
with open(image_path, 'rb') as image_file:
    # 使用 multipart/form-data 发送文件
    files = {
        'file': image_file
    }
    
    # 向接口发送POST请求
    response = requests.post(upload_url, files=files)

# 打印响应状态码和内容
print(f"状态码: {response.status_code}")
print(f"响应内容: {response.text}")

# 检查响应
if response.status_code == 200:
    try:
        result = response.json()
        print(f"完整的JSON响应: {result}")
        if isinstance(result, list) and result and 'src' in result[0]:
            # 拼接图片的URL
            image_url = f"https://telegra.ph{result[0]['src']}"
            print(f"Image uploaded successfully: {image_url}")
        else:
            print(f"Unexpected response format: {response.text}")
    except ValueError:
        print(f"Failed to parse JSON response: {response.text}")
else:
    print(f"Error uploading image: {response.status_code} - {response.text}")
