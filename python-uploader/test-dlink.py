#!/usr/bin/env python3
"""
DLink Image Uploader
上传图片到 DLink 图床服务
"""

import requests

# 配置项
IMAGE_PATH = "/Volumes/TP4000PRO/20251023-092722.jpeg"
UPLOAD_URL = "https://www.dlink666.com/api/upload"


def upload_file(file_path: str, file_name: str, url: str = UPLOAD_URL):
    """
    使用 PUT 方法上传文件二进制
    :param file_path: 本地文件路径
    :param file_name: 上传时的文件名
    :param url: 填写directlink部署地址+api/upload
    :return: 响应文件直链
    """
    with open(file_path, "rb") as f:
        file_data = f.read()

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
    }

    response = requests.put(
        url,
        data=file_data,
        params={"name": file_name},
        headers=headers
    )
    response.raise_for_status()  # 抛出异常（如果请求失败）

    return response.text


if __name__ == "__main__":
    print('开始上传')
    res = upload_file(
        file_path=IMAGE_PATH,
        file_name="20251023-092722.jpeg"
    )
    print(f"上传成功: {res}")
