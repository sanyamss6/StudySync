
FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN javac -d . src/main/java/StudySyncServer.java

EXPOSE 8080

CMD ["java", "StudySyncServer"]
