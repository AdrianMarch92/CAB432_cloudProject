import urllib.request as ur
import boto3
import time
import json
from vehicle_count import from_static_image
# AWS credentials and region configuration
AWS_ACCESS_KEY = 'placeholder'
AWS_SECRET_KEY = 'placeholder'
AWS_SESSION_TOKEN = 'placeholder'
AWS_REGION = 'ap-southeast-2'



# Initialize SQS client

sqs = boto3.client('sqs', region_name=AWS_REGION, aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY, aws_session_token=AWS_SESSION_TOKEN
)

# URL of your SQS queue
queue_url = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/cab432_team42'

def process_message(message):
    cars = 0
    mortorbikes = 0
    buses = 0
    trucks = 0
    messagejson = json.loads(message['Body'])
    print(messagejson)
    # Process the message data
    id = messagejson['carmeraid']
    url = messagejson['imageURL']
    # Perform an action with the ID and URL from the message
    print(f"Received message - ID: {id}, URL: {url}")
    cars, mortorbikes, buses, trucks = from_static_image(url)
   
    # Implement your action here using the received ID and URL
    print(f"Output values: cars - {cars}, mortorbikes- {mortorbikes}, buses - {buses}, trucks {trucks}")

if __name__ == '__main__':
    # realTime()
    
    while True:
    # Long-poll for messages (20 seconds in this case)
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=20
        )
        #example message:
        #        {"carmeraid":1,"imageURL":"https://d2w9pjl8ozl6el.cloudfront.net/Metropolitan/Indooroopilly_Western_Fwy_Sth.jpg"}

        if 'Messages' in response:
            for message in response['Messages']:
                process_message(message)
                # Delete the message from the queue once processed
                receipt_handle = message['ReceiptHandle']
                sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)

        # Add a delay before polling again to avoid making too many requests
        time.sleep(10)  # Change the delay time as needed   