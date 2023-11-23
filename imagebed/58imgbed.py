import base64
import requests
import json
import random
import sys

# 检查命令行参数
if len(sys.argv) < 2:
    print("使用方法: python3 script.py <file_path>")
    sys.exit(1)

# 图像文件路径从命令行参数获取
image_path = sys.argv[1]

# 读取并转换图像为Base64
with open(image_path, 'rb') as image_file:
    base64_encoded_data = base64.b64encode(image_file.read()).decode('utf-8')

# 构建请求负载
payload = {
    "Pic-Size": "0*0",
    "Pic-Encoding": "base64",
    "Pic-Path": "/nowater/webim/big/",
    "Pic-Data": base64_encoded_data
}

# 目标URL
target_url = "https://upload.58cdn.com.cn/json/nowater/webim/big/"

# 发送POST请求
response = requests.post(target_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))

# 处理响应
if response.status_code == 200:
    result = response.text.strip()
    # 随机生成1到8之间的数字
    random_number = random.randint(1, 8)
    final_url = f"https://pic{random_number}.58cdn.com.cn/nowater/webim/big/{result}"
    print(final_url)
else:
    print("Error:", response.text)
