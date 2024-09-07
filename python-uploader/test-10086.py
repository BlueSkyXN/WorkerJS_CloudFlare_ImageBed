import requests

url = 'https://mlw10086.serv00.net/upload.php'
file_path = r'F:\Download\20240707-204330.jpg'

headers = {
    'accept': '*/*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
    'cache-control': 'no-cache',
    'dnt': '1',
    'origin': 'https://mlw10086.serv00.net',
    'pragma': 'no-cache',
    'referer': 'https://mlw10086.serv00.net/',
    'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
}

with open(file_path, 'rb') as file:
    files = {
        'file': ('20240707-204330.jpg', file, 'image/jpeg')
    }
    response = requests.post(url, headers=headers, files=files)

print("响应状态码:", response.status_code)
print("响应内容:", response.text)
