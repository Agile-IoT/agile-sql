FROM resin/raspberry-pi3-node:7.8.0-20170426
ARG BASEIMAGE_BUILD=resin/raspberry-pi3-node:7.8.0-20170426

#FROM resin/intel-nuc-node:7.8.0-20170506

COPY . /opt/app
WORKDIR /opt/app/
RUN rm -rf node_modules
RUN npm install
EXPOSE 3005
RUN ls -la
RUN chmod +x start.sh
CMD ./start.sh
