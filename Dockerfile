
ARG BASEIMAGE_BUILD=agileiot/raspberry-pi3-zulujdk:8-jdk-maven
#ARG BASEIMAGE_DEPLOY=agileiot/raspberry-pi3-zulujdk:8-jre

FROM $BASEIMAGE_BUILD
COPY SQLParser /usr/src/app
WORKDIR /usr/src/app

RUN ["mvn", "clean"]
RUN ["mvn", "dependency:resolve"]
RUN ["mvn", "verify"]
RUN ["mvn", "package"]
#ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -jar target/agile-sqlparser-0.1-SNAPSHOT-jar-with-dependencies.jar" ]
ENTRYPOINT [ "mvn", "exec:java" ]


#FROM $BASEIMAGE_DEPLOY
#COPY --from=0 /usr/src/app usr/src/app
#WORKDIR /usr/src/app
#ENV JAVA_OPTS=""
#ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -jar target/agile-sqlparser-0.1-SNAPSHOT-jar-with-dependencies.jar" ]

