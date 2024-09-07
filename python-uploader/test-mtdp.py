import requests
import logging
import os
# https://hostloc.com/thread-1299919-1-1.html
# https://github.com/zixiwu/mt-img-bed/blob/main/mt.php
# https://github.com/k08255-lxm/WX-MT_Image/blob/main/upload_mtkf.php
# 日志配置
log_file = os.path.join(os.path.dirname(__file__), 'log.txt')
logging.basicConfig(filename=log_file, level=logging.INFO, format='[%(asctime)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

def log_message(message):
    logging.info(message)

# 目标 URL
target_url = 'https://kf.dianping.com/api/file/singleImage'

# 文件路径
image_path = r"F:\Download\ecabfc9aa7dace978229f8563ab5c856fe530eea.jpg"

# Headers
headers = {
    'Referer': 'https://h5.dianping.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
}

# 准备 POST 数据，使用 `files` 参数来上传文件
files = {
    'file': ('ecabfc9aa7dace978229f8563ab5c856fe530eea.jpg', open(image_path, 'rb'), 'image/jpeg'),
    'channel': (None, '4')  # 这里的 'channel' 是表单中的普通字段，None 表示不传文件
}

try:
    # 发送 POST 请求
    response = requests.post(target_url, headers=headers, files=files)
    http_code = response.status_code
    log_message(f"HTTP Code: {http_code}")
    
    # 解析响应
    if response.status_code == 200:
        try:
            response_data = response.json()
            log_message(f"Response: {response_data}")
            
            # 检查返回的 JSON 数据是否有 'uploadPath'
            if 'data' in response_data and 'uploadPath' in response_data['data']:
                upload_url = response_data['data']['uploadPath']
                print(f"上传成功，图片访问路径: {upload_url}")
            else:
                log_message(f"未能获取链接: {response_data}")
                print(f"上传失败，未能获取链接: {response_data}")
        except ValueError as e:
            log_message(f"JSON 解析错误: {e}")
            print(f"JSON 解析错误: {e}")
    else:
        log_message(f"图片上传失败: HTTP Code {http_code}, Response: {response.text}")
        print(f"图片上传失败: HTTP Code {http_code}, Response: {response.text}")

except requests.exceptions.RequestException as e:
    log_message(f"请求错误: {e}")
    print(f"请求错误: {e}")
finally:
    # 关闭文件
    files['file'][1].close()
