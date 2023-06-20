#!/bin/sh
if [ -z "$1" ]
then
  echo "Which folder do you want to deploy to GitHub Pages?"
  exit 1
fi
npm run build
git add dist/*
git commit -am "Auto Deploy Commit"
git subtree push --prefix $1 origin gh-pages
git push origin main