VHOST:=demo.smoothie.rocks
DOCKFILE:=mbejda/wordpress-wpcli-plugins
OPTS:=
_ID:=

default:
	@echo Start node server
	node ./bin/www.js  -e HOST="smoothie.rocks"

kill_all:
	docker kill $(docker ps -q)

stop_proxy:
	docker kill proxy_1234321


start_proxy:
	docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock -t jwilder/nginx-proxy


start_dockfile:
	docker run  -d -e "VIRTUAL_HOST=$(VHOST)" -e "SITEURL=$(VHOST)" $(OPTS) -t $(DOCKFILE)


stop_dockfile:
	docker kill $(_ID)


status:
	docker ps

config:
	boot2docker shellinit
