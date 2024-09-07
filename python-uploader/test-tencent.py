import requests

# 上传图片接口的URL
upload_url = "https://openai.weixin.qq.com/weixinh5/webapp/h774yvzC2xlB4bIgGfX2stc4kvC85J/cos/upload"

# 图片路径
image_path = r"F:\Download\ecabfc9aa7dace978229f8563ab5c856fe530eea.jpg"

# 准备上传的文件，模拟 PHP 中的 `CURLFile`，用 `files` 参数传递文件
files = {
    'media': ('ecabfc9aa7dace978229f8563ab5c856fe530eea.jpg', open(image_path, 'rb'), 'image/jpeg')
}

# 发送POST请求，上传图片
try:
    response = requests.post(upload_url, files=files)
    response.raise_for_status()  # 检查请求是否成功

    # 解析响应数据
    response_data = response.json()
    if 'url' in response_data:
        print("图片上传成功，访问URL为：", response_data['url'])
    else:
        print("上传失败，服务器未返回URL:", response_data)

except requests.exceptions.RequestException as e:
    print(f"图片上传失败: {e}")
finally:
    # 关闭文件
    files['media'][1].close()
