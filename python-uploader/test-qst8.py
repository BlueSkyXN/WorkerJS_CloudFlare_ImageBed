import requests

url = 'https://api.qst8.cn/api/front/upload/img'
headers = {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
    'branchid': '1002',
    'cache-control': 'no-cache',
    'dnt': '1',
    'origin': 'https://mlw10086.serv00.net',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://mlw10086.serv00.net/',
    'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'sign': 'e346dedcb06bace9cd7ccc6688dd7ca1',
    'source': 'h5',
    'tenantid': '3',
    'timestamp': '1725792862411',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
}

# 将本地图片路径替换为你的文件路径
file_path = r'F:\Download\8cb1cb1349540923bbe442361e274a05b2de4970.jpeg'

# 构建 multipart/form-data 的文件数据
files = {
    'file': ('8cb1cb1349540923bbe442361e274a05b2de4970.jpeg', open(file_path, 'rb'), 'image/jpeg')
}

# 发送请求
response = requests.post(url, headers=headers, files=files)

# 输出返回结果
print(response.status_code)
print(response.text)
