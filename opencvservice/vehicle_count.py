# TechVidvan Vehicle counting and Classification

# Import necessary packages

import cv2
import csv
import collections
import numpy as np
from tracker import *
import urllib.request as ur
import boto3
import time
import json
# AWS credentials and region configuration
AWS_ACCESS_KEY = 'placeholder'
AWS_SECRET_KEY = 'placeholder'
AWS_SESSION_TOKEN = 'placeholder'
AWS_REGION = 'ap-southeast-2'

# Initialize Tracker
tracker = EuclideanDistTracker()

# Initialize the videocapture object
cap = cv2.VideoCapture('video.mp4')
input_sizex = 320
input_sizey = 256

# Detection confidence threshold
confThreshold =0.2
nmsThreshold= 0.2

font_color = (0, 0, 255)
font_size = 0.5
font_thickness = 2

# Middle cross line position
middle_line_position = 225   
up_line_position = middle_line_position - 15
down_line_position = middle_line_position + 15


# Store Coco Names in a list
classesFile = "coco.names"
classNames = open(classesFile).read().strip().split('\n')
print(classNames)
print(len(classNames))

# class index for our required detection classes
required_class_index = [2, 3, 5, 7]

detected_classNames = []

## Model Files
modelConfiguration = 'yolov3-320.cfg'
modelWeigheights = 'yolov3-320.weights'

# configure the network model
net = cv2.dnn.readNetFromDarknet(modelConfiguration, modelWeigheights)

# Configure the network backend

net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)

# Define random colour for each class
np.random.seed(42)
colors = np.random.randint(0, 255, size=(len(classNames), 3), dtype='uint8')


# Function for finding the center of a rectangle
def find_center(x, y, w, h):
    x1=int(w/2)
    y1=int(h/2)
    cx = x+x1
    cy=y+y1
    return cx, cy
    
# List for store vehicle count information
temp_up_list = []
temp_down_list = []
up_list = [0, 0, 0, 0]
down_list = [0, 0, 0, 0]

# Function for count vehicle
def count_vehicle(box_id, img):

    x, y, w, h, id, index = box_id

    # Find the center of the rectangle for detection
    center = find_center(x, y, w, h)
    ix, iy = center
    
    # Find the current position of the vehicle
    if (iy > up_line_position) and (iy < middle_line_position):

        if id not in temp_up_list:
            temp_up_list.append(id)

    elif iy < down_line_position and iy > middle_line_position:
        if id not in temp_down_list:
            temp_down_list.append(id)
            
    elif iy < up_line_position:
        if id in temp_down_list:
            temp_down_list.remove(id)
            up_list[index] = up_list[index]+1

    elif iy > down_line_position:
        if id in temp_up_list:
            temp_up_list.remove(id)
            down_list[index] = down_list[index] + 1

    # Draw circle in the middle of the rectangle
    cv2.circle(img, center, 2, (0, 0, 255), -1)  # end here
    # print(up_list, down_list)

# Function for finding the detected objects from the network output
def postProcess(outputs,img):
    global detected_classNames 
    height, width = img.shape[:2]
    boxes = []
    classIds = []
    confidence_scores = []
    detection = []
    for output in outputs:
        for det in output:
            scores = det[5:]
            classId = np.argmax(scores)
            confidence = scores[classId]
            if classId in required_class_index:
                if confidence > confThreshold:
                    # print(classId)
                    w,h = int(det[2]*width) , int(det[3]*height)
                    x,y = int((det[0]*width)-w/2) , int((det[1]*height)-h/2)
                    boxes.append([x,y,w,h])
                    classIds.append(classId)
                    confidence_scores.append(float(confidence))

    # Apply Non-Max Suppression
    indices = cv2.dnn.NMSBoxes(boxes, confidence_scores, confThreshold, nmsThreshold)
    # print(classIds)
    if len(indices) > 0:
        for i in indices.flatten():
            x, y, w, h = boxes[i][0], boxes[i][1], boxes[i][2], boxes[i][3]
            # print(x,y,w,h)

            color = [int(c) for c in colors[classIds[i]]]
            name = classNames[classIds[i]]
            detected_classNames.append(name)
            # Draw classname and confidence score 
            cv2.putText(img,f'{name.upper()} {int(confidence_scores[i]*100)}%',
                    (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

            # Draw bounding rectangle
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 1)
            detection.append([x, y, w, h, required_class_index.index(classIds[i])])

    # Update the tracker for each object
    boxes_ids = tracker.update(detection)
    for box_id in boxes_ids:
        count_vehicle(box_id, img)


def realTime():
    while True:
        success, img = cap.read()
        img = cv2.resize(img,(0,0),None,0.5,0.5)
        ih, iw, channels = img.shape
        blob = cv2.dnn.blobFromImage(img, 1 / 255, (input_sizex, input_sizey), [0, 0, 0], 1, crop=False)

        # Set the input of the network
        net.setInput(blob)
        layersNames = net.getLayerNames()
        outputNames = [(layersNames[i[0] - 1]) for i in net.getUnconnectedOutLayers()]
        # Feed data to the network
        outputs = net.forward(outputNames)
    
        # Find the objects from the network output
        postProcess(outputs,img)

        # Draw the crossing lines

        cv2.line(img, (0, middle_line_position), (iw, middle_line_position), (255, 0, 255), 2)
        cv2.line(img, (0, up_line_position), (iw, up_line_position), (0, 0, 255), 2)
        cv2.line(img, (0, down_line_position), (iw, down_line_position), (0, 0, 255), 2)

        # Draw counting texts in the frame
        cv2.putText(img, "Up", (110, 20), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
        cv2.putText(img, "Down", (160, 20), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
        cv2.putText(img, "Car:        "+str(up_list[0])+"     "+ str(down_list[0]), (20, 40), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
        cv2.putText(img, "Motorbike:  "+str(up_list[1])+"     "+ str(down_list[1]), (20, 60), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
        cv2.putText(img, "Bus:        "+str(up_list[2])+"     "+ str(down_list[2]), (20, 80), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
        cv2.putText(img, "Truck:      "+str(up_list[3])+"     "+ str(down_list[3]), (20, 100), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)

        # Show the frames
        cv2.imshow('Output', img)

        if cv2.waitKey(1) == ord('q'):
            break

    # Write the vehicle counting information in a file and save it

    with open("data.csv", 'w') as f1:
        cwriter = csv.writer(f1)
        cwriter.writerow(['Direction', 'car', 'motorbike', 'bus', 'truck'])
        up_list.insert(0, "Up")
        down_list.insert(0, "Down")
        cwriter.writerow(up_list)
        cwriter.writerow(down_list)
    f1.close()
    # print("Data saved at 'data.csv'")
    # Finally realese the capture object and destroy all active windows
    cap.release()
    cv2.destroyAllWindows()


#image_file = 'https://d2w9pjl8ozl6el.cloudfront.net/Metropolitan/Indooroopilly_Western_Fwy_Sth.jpg'
def from_static_image(image):

    req = ur.urlopen(image)
    arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
    img = cv2.imdecode(arr, -1) # 'Load it as it is'
    

    blob = cv2.dnn.blobFromImage(img, 1 / 255, (input_sizex, input_sizey), [0, 0, 0], 1, crop=False)

    # Set the input of the network
    net.setInput(blob)
    layersNames = net.getLayerNames()
    outputNames = [(layersNames[i - 1]) for i in net.getUnconnectedOutLayers()]
    # Feed data to the network
    outputs = net.forward(outputNames)

    # Find the objects from the network output
    postProcess(outputs,img)

    # count the frequency of detected classes
    frequency = collections.Counter(detected_classNames)
    print("Car: " + str(frequency['car']))
    print("Motorbike: " + str(frequency['motorbike']))
    print("Bus: " + str(frequency['bus']))
    print("Truck: " + str(frequency['truck']))

    ##
    ###I have made changes to this base example to return the values and not draw the image. 
    ##
    # Draw counting texts in the frame
    # cv2.putText(img, "Car:        "+str(frequency['car']), (20, 40), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
    # cv2.putText(img, "Motorbike:  "+str(frequency['motorbike']), (20, 60), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
    # cv2.putText(img, "Bus:        "+str(frequency['bus']), (20, 80), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)
    # cv2.putText(img, "Truck:      "+str(frequency['truck']), (20, 100), cv2.FONT_HERSHEY_SIMPLEX, font_size, font_color, font_thickness)


    # cv2.imshow("image", img)

    # cv2.waitKey(0)

    # save the data to a csv file
    #with open("static-data.csv", 'a') as f1:
    #    cwriter = csv.writer(f1)
    #    cwriter.writerow([image, frequency['car'], frequency['motorbike'], frequency['bus'], frequency['truck']])
    #f1.close()
    return  frequency['car'], frequency['motorbike'], frequency['bus'], frequency['truck']




############## Have added the handling from SQS and db work. 
# Initialize SQS client

sqs = boto3.client('sqs', region_name=AWS_REGION, aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY, aws_session_token=AWS_SESSION_TOKEN
)

# URL of your SQS queue
queue_url = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/cab432_team42'

# initialise database
import sqlalchemy as sa
engine = sa.create_engine('postgresql://placeholder:placeholder@cloudproject-team42.ce2haupt2cta.ap-southeast-2.rds.amazonaws.com:5432/traffic')

from sqlalchemy import text

# Where the magic happens
def process_message(message):
    # hard reset past totals. 
    cars = 0
    mortorbikes = 0
    buses = 0
    trucks = 0
    global detected_classNames
    detected_classNames = []
    global temp_up_list 
    temp_up_list = []
    global temp_down_list 
    temp_down_list= []
    try: 
        messagejson = json.loads(message['Body'])
        print(messagejson)
        # Process the message data get the id and image url
        id = messagejson['carmeraid']
        url = messagejson['imageURL']
       
        print(f"Received message - ID: {id}, URL: {url}")
        # Performs the count returning the values. 
        cars, mortorbikes, buses, trucks = from_static_image(url)
    
        # stores the data into the database. 
        print(f"Output values: cars - {cars}, mortorbikes- {mortorbikes}, buses - {buses}, trucks {trucks}")
        with engine.connect() as connection:
                    statement2 = f"insert into traffic.public.traffic_volume (cameraid, cars, buses, trucks, motorbikes) values('{id}','{cars}','{buses}','{trucks}','{mortorbikes}'); "
                    connection.execute(text(statement2))
                    connection.commit()

        # returns the id.
        return id
    except:
        print("Error processing ticket")

    return 0
    



if __name__ == '__main__':
    #Starts the service on an infinite loop
    # uncomment this if the camers were live feeds. 
    # realTime()
    
    while True:
        

    # poll sqs for 5 seconds pulling 5 tickets at a time. 
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=5,
            WaitTimeSeconds=5
        )
        #example message:
        #        {"carmeraid":1,"imageURL":"https://d2w9pjl8ozl6el.cloudfront.net/Metropolitan/Indooroopilly_Western_Fwy_Sth.jpg"}

        if 'Messages' in response:
            for message in response['Messages']:
                id = process_message(message)
                # Delete the message from the queue once processed
                receipt_handle = message['ReceiptHandle']
                sqs.delete_message(QueueUrl=queue_url
                , ReceiptHandle=receipt_handle)
                #creating a new ticket 
                #todo: add check to either db or cache for if cameraid is still enabled 
                with engine.connect() as connection:
                    #id = 1
                    # Checks if the camera monitoring is enabled in the database or disabled. 
                    statement = f"SELECT status FROM traffic.public.camera_config where cameraid ='{id}' "
                    rs = connection.execute(text(statement))
                    #will assume it is until told otherwise. great for testing. 
                    assumedtrue = True
                    
                    for row in rs:

                        if row[0] == True:
                            print("true")   
                            # We send with a delay the rational behind the delay is that as per the QLD Traffic API 
                            # documentation the images are refreshed every 60 seconds. 
                            # We could have used 30 seconds but chose 90 to give a buffer. 
                            # Our scaling will be based on the number of messages currently delayed this gives us an idea of how many are coming.                  
                            sendresponse = sqs.send_message(
                                QueueUrl=queue_url,
                                DelaySeconds=90,
                                MessageBody=(message['Body'])

                            )
                            print("Message: " + sendresponse['MessageId'])
                        else:
                            print("Ending abusive cycle.")

        # Add a delay before polling again to avoid making too many calls to the sqs service
        time.sleep(10)  
