FROM ipfs/go-ipfs:release
MAINTAINER Jdoge <jstenberg86@gmail.com>

COPY start_ipfs.sh /usr/local/bin/start_ipfs

ENTRYPOINT ["/usr/local/bin/start_ipfs"]

CMD ["daemon", "--migrate=true"]