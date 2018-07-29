FROM node:6 as build_job
ADD . /src
WORKDIR /src
RUN npm install && npm run build && mkdir /src/pkg
RUN npm run pkg-docker && npm run pkg-docker-healthcheck

FROM alpine:3.5
ARG version
ARG buildNumber
# RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/* 
ENV VERSION=${version}
ENV BUILD_NUMBER=${buildNumber}

RUN apk update && apk add --no-cache libstdc++ libgcc
COPY --from=build_job /src/pkg/app /src/app
COPY --from=build_job /src/pkg/healthcheck /src/healthcheck
WORKDIR /src
EXPOSE 3000
CMD ["/src/app"]
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 CMD "./src/healthcheck"