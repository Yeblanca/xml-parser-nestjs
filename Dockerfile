# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Command to run your app
CMD ["npm", "run", "start"]
