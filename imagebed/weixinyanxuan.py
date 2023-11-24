import requests
import hashlib
import random
import time
import sys

### 参考文档 https://hostloc.com/thread-1237266-1-1.html
### 可能是违法诈骗网站使用的账号
### 仅供学习CloudFlareWorkerJS和Python使用

def generate_random_string(length):
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    return ''.join(random.choice(characters) for i in range(length))

def calculate_md5_hash(nonce, timestamp):
    secret = "fuck-your-mother-three-thousand-times-apes-not-kill-apes"
    hasher = hashlib.md5()
    hasher.update(f"nonce={nonce}&timestamp={timestamp}{secret}".encode('utf-8'))
    return hasher.hexdigest()

# 获取命令行参数
if len(sys.argv) < 2:
    print("请提供文件路径")
    sys.exit(1)

file_path = sys.argv[1]

# 生成随机字符串和时间戳
nonce = generate_random_string(8)
timestamp = str(int(time.time() * 1000))

# 计算MD5哈希
accept_locale = calculate_md5_hash(nonce, timestamp)

# 准备表单数据
files = {'file': (file_path, open(file_path, 'rb'))}
data = {
    'nonce': nonce,
    'timestamp': timestamp
}

# 发送请求
response = requests.post(
    "https://api.weixinyanxuan.com/mall/api/img/upload",
    headers={
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9",
        "accept-locale": accept_locale,
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site"
    },
    files=files,
    data=data
)

# 处理响应
if response.ok:
    res_data = response.json()
    img_url = res_data.get('data')
    if img_url:
        print(img_url)
    else:
        print("响应没有包含文件地址")
else:
    print("请求失败，状态码：", response.status_code)
    print("详细信息：", response.text)
