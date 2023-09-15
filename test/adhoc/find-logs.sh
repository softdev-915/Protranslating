#!/bin/bash
# This script searches all logs for request with some ids.
# Change your id's accordingly.
IDS=(
    "d18dd9dd-9422-466b-8856-a44af2407451"
    "7938c597-4654-491c-8a46-fce323eb120e"
    "3115b976-604f-4844-8a40-d0623cd5db86"
    "f985ff83-f8d5-43f8-8ef5-a21ce5f61240"
    "30673dbd-57e1-4ceb-a46c-f799e2f583fc"
    "681af7b5-5cfb-4faf-a43a-fde7ffd880e5"
    "35d82736-4050-473b-a181-be4427020aa8"
    "a01bf24a-bd92-4ee9-8520-4de086de1168"
    "f43f43df-649a-4c19-bc1d-be83d6d9aa28"
    "66b9a58d-a751-4cd8-8219-6457a3f92697"
    "540ec30b-ecd4-4a2f-bcf1-49dbd53a92aa"
    "147646ae-d7d5-47f5-a6f9-ec201905a491"
    "cbf4c243-1d5c-4ee5-8f50-fe79e29d48af"
    "7ca0c1d3-c321-4075-8b3a-2d6fff04fe56"
    "3d74e825-d27d-4860-bb79-91e1a8192bdd"
    "e1b0ab70-b1ee-44b6-bf21-6fde2a7a5b4b"
    "f25e3250-6943-4983-975a-bb4446ec65fd"
    "9188bb90-e375-491a-9cef-38a2c1318f84"
    "2ec57ad3-4154-46d0-8823-7c7e24b6bcce"
    "fa4d6792-468d-4291-9253-8b927b99715b"
    "5d9f4496-bba1-4628-a163-5c05c56f55f2"
    "8009c8d5-6579-4925-85fe-b780b9c60c9f"
    "263455b4-4ae9-439f-b064-5c7642c514c4"
    "dde23cdf-cb4c-4eff-977b-e55dd6800057"
    "c39e957d-e994-4685-95e0-3723bfb006f1"
    "93da60bb-d17e-4bc8-8e22-cb088503c467"
    "f2aa748b-c51e-4506-b50b-ed975cf01365"
    "fb137f75-6982-402a-a435-3c361104878a"
    "afd53e81-24ae-4210-be15-d7321fbbd097"
    "15382f46-027e-48e3-a991-b8a698d9cba0"
    "aec0ed27-0b69-4875-9408-336440da1965"
    "ac25acff-03e2-4b7f-a7f7-b6a4174e0508"
    "26db12d5-7553-48ef-8303-218a4da4d9fc"
    "648c3f10-e664-4f1c-be10-d9758f0da809"
)

ID_GROUP=""
COUNT=0
for ID in "${IDS[@]}"
do
  if [ $COUNT -lt 1 ]
  then
    COUNT=1
    ID_GROUP="$ID"
  else
    ID_GROUP="$ID_GROUP\|$ID"
  fi
done

JSON_REGEXP=".*\"requestId\":\"\($ID_GROUP\)\".*"
PLAIN_REGEXP=".*requestId=\($ID_GROUP\).*"

for POD_ID in $(kubectl get pods | awk '{print $1}' | grep node); do
  kubectl exec -ti $POD_ID -- grep --include=lms\* -rnw '/var/log' -e "$JSON_REGEXP"
  kubectl exec -ti $POD_ID -- grep --include=lms\* -rnw '/root/.pm2/logs/lms-napi-error.log' -e "$PLAIN_REGEXP"
done
