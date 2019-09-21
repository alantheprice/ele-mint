git remote update

gitStatusMessage=$(git status 2>&1)

# echo "Git Status message: $gitStatusMessage"

if [[ $gitStatusMessage  = *"Your branch is up to date with"* ]]; then
    echo "Your branch is up to date, feel free to update the version number"
    exit 0
else
    echo "Looks like your branch needs to sync up with the remote. Do that first then update the version."
    exit 1
fi
