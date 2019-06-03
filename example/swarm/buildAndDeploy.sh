docker build -t swarmgqltester ../../. 
docker stack deploy --compose-file docker-compose.yml api