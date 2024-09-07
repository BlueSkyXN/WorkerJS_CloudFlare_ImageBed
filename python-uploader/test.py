import requests

def upload_image(file_path):
    url = "https://ihs.aag.moe/upload.php"
    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
        'cache-control': 'no-cache',
        'dnt': '1',
        'origin': 'https://ihs.aag.moe',
        'pragma': 'no-cache',
        'referer': 'https://ihs.aag.moe/',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    }

    # 打开图片文件并使用 multipart/form-data 发送
    with open(file_path, 'rb') as image_file:
        files = {'file': image_file}  # 上传文件的字段名为 'file'
        response = requests.post(url, headers=headers, files=files)

    # 输出响应信息
    print(f"响应体: {response}")
    print(f"HTTP 状态码: {response.status_code}")
    print(f"响应内容: {response.text}")

# 本地图片文件路径
file_path = "F:\\Download\\b52d18627d2ce06dcf22b0b777b51fde410fb4da.jpg@100Q.jpg"

# 执行上传
upload_image(file_path)
