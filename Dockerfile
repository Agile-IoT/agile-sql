FROM resin/intel-nuc-node:7.8.0-20170506
#FROM resin/raspberry-pi3-node:7.8.0-20170426

COPY lib /opt/app
WORKDIR /opt/app/
RUN rm -rf node_modules
RUN npm install
EXPOSE 3030
RUN ls -la
RUN chmod +x start.sh
CMD ./start.sh
