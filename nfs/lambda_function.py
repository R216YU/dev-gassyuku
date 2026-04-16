import json
import os

def lambda_handler(event, context):
    os.makedirs('/mnt/s3/test', exist_ok=True)  # exist_ok=TrueでフォルダがあってもOK
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
