# Steps to local dev
- Clone repo to machine

## Start a postgres database instance 

Using Docker create a postgres instance (note you only) account: 
```bash
docker run --hostname=3bdecebd822b --mac-address=02:42:ac:11:00:02 --env=POSTGRES_PASSWORD=Pandasrule01! --env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/lib/postgresql/16/bin --env=GOSU_VERSION=1.16 --env=LANG=en_US.utf8 --env=PG_MAJOR=16 --env=PG_VERSION=16.0-1.pgdg120+1 --env=PGDATA=/var/lib/postgresql/data --volume=/var/lib/postgresql/data -p 5432:5432 --restart=no --runtime=runc -d postgres
```

Once created then you will not need to run that command anymore just navigate to docker-desktop and start the database with the start button 

Then click on the instance then go to exec to enter the shell and type psql -U postgres

then copy the SQL commands from database.sql inside Opencvservice and paste inside that docker exec shell window to start the database. 

Leave this running. 

## Opencv service 
Open the openCv service and edit the AWS config and the database configs 

replace line 15 - line 17 of vehicle_count.py
```python
AWS_ACCESS_KEY = 'placeholder'
AWS_SECRET_KEY = 'placeholder'
AWS_SESSION_TOKEN = 'placeholder'
```
with your AWS Access key and secret key as well as the token. 

Then replace line 279 with the deatbase credntials setup earlier: 
```python
engine = sa.create_engine('postgresql://placeholder:placeholder@cloudproject-team42.ce2haupt2cta.ap-southeast-2.rds.amazonaws.com:5432/traffic')
```
example: 
Then replace line 279 with the deatbase credntials setup earlier: 
```python
engine = sa.create_engine('postgresql://postgres:Pandasrule01!@cloudproject-team42.ce2haupt2cta.ap-southeast-2.rds.amazonaws.com:5432/traffic')
```

Once complete setup a python virtual environment with the following commands: 
first cd into the opencvservice folder and run: 
```bash 
python3 -m venv venv
```
Activate the virtual environment with: 
```bash
source ./venv/bin/activate
```
Then install dependancies with: 
```bash
pip3 install -r requirements.txt
```
then start the backend service with: 
```bash 
python3 ./vehicle_count.py
```

## Backend service

Start the backend service with docker-compose 
- Note might require the install of docker-compose use sudo-apt install docker-compose to install it. 

First change the endpoints to look for the right services: 

in knexfile.js change the following to be: 
```javascript 
   host : 'localhost',
        port : 5432,
        user : 'postgres',
        password : 'Pandasrule01!',
        database : 'traffic',
```

In routes/index.js change the lines at line 90 to match the same as what is in your opencv service:
```javascript 
AWS.config.update({
            accessKeyId: 'placeholder',
            secretAccessKey: 'placeholder',
            sessionToken: 'placeholder',
            region: "ap-southeast-2",
        });
```

cd into the backend folder
run the command 
```bash
docker-compose build
```
Once the build is complete run the command 
```bash
docker-compose up -d
```
To stop it run: 
run the command 
```bash
docker-compose down
```

## frontend 

Makesure that the api is looking to localhost: 
change all occurances of the below in files: client/src/componets/NewCameraView.js and client/src/componets/CameraDetails.js 
```
http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001
``` 
to be: 
```
http://localhost:3001
```

cd into the clien directory. 
run the command: 
```bash
npm install 
```
run the command: 
```bash
npm start
```

Congratulations the project should now be 100% functional. 