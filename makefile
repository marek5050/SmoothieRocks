VHOST:=demo.smoothie.rocks
DOCKFILE:=mbejda/wordpress-wpcli-plugins
OPTS:=
_ID:=
USER:=

default:
	@echo Start node server

filter:
	docker rm $(comm -13 <(docker ps -q | sort) <(docker ps -a -q | sort))


kill_all:
	docker kill $(docker ps -q)


start:
	docker start $(_ID)

pause:
	docker pause $(_ID)

kill:
	docker kill $(_ID)

commit:
	docker commit $(_ID) backup_$(USER)_$(VHOST)



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
