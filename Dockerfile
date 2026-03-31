FROM busybox:latest

ARG JANUSXR_VERSION="1.5.56"

WORKDIR /www
COPY build/$JANUSXR_VERSION/janusxr.com .

# assimilate the crossplatform binary into host architecture
# otherwise docker will complain with 'Exec format error'
RUN wget https://cosmo.zip/pub/cosmos/bin/assimilate && \
    chmod +x assimilate && \
    ./assimilate ./janusxr.com 

CMD ["/www/janusxr.com"]
