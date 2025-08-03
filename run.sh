#!/bin/bash
# Single command Docker launch pour ft_transcendence - Conforme aux exigences du sujet
docker compose -f .devcontainer/docker-compose.yml up prod --build
