set -e
set -u
# nr. of experiment iterations
N=100

# experiment commands
commands=(
   "npm run start:v2 -- --cskIndexA=0 --cskIndexB=6 --N=$N --dbName=db-cs-0-6"
   "npm run start:v2 -- --cskIndexA=6 --cskIndexB=15 --N=$N --dbName=db-cs-6-15"
   "npm run start:v2 -- --cskIndexA=15 --cskIndexB=21 --N=$N --dbName=db-cs-15-21"
   "npm run start:v2 -- --cskIndexA=21 --cskIndexB=29 --N=$N --dbName=db-cs-21-29"
   "npm run start:v2 -- --cskIndexA=29 --cskIndexB=38 --N=$N --dbName=db-cs-29-38"
   "npm run start:v2 -- --cskIndexA=38 --cskIndexB=47 --N=$N --dbName=db-cs-38-47"
  "npm run start:v2 -- --cskIndexA=47 --cskIndexB=55 --N=$N --dbName=db-cs-47-55"
)

T_START=$(date)
for cmd in "${commands[@]}"; do
  echo "[$(date)] Executing:\n\t$cmd"
  dbName=$(echo $cmd | awk -F'--dbName=' '{print $2}' | awk '{print $1}')
  echo "dbName: $dbName"
  nohup bash -c "$cmd" > "./${dbName}.stdout" 2>&1 &
done

T_END=$(date)
echo "START: $T_START\nEND: $T_END"
echo "To execute following commands: ${commands[@]}"
