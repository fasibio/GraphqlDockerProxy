FROM node:9 as build_job
ADD . /src
WORKDIR /src
RUN npm install && mkdir /src/nexe
RUN npm run nexe-docker && npm run nexe-docker-healthcheck

FROM alpine:3.5
ARG version
ARG buildNumber
# RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/* 
ENV VERSION=${version}
ENV BUILD_NUMBER=${buildNumber}

RUN apk update && apk add --no-cache libstdc++ libgcc
COPY --from=build_job /src/nexe/app /src/app
COPY --from=build_job /src/nexe/healthcheck /src/healthcheck
WORKDIR /src
EXPOSE 3000
CMD ["/src/app"]
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 CMD "/src/healthcheck"
