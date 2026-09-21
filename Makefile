.PHONY: help api-run api-build web-install web-dev mobile-install mobile-analyze mobile-test mobile-format mobile-run

help:
	@echo "HireWise Monorepo Commands:"
	@echo "  api-run         - Run ASP.NET Core API with watch"
	@echo "  api-build       - Build ASP.NET Core API"
	@echo "  web-install     - Install React web app dependencies"
	@echo "  web-dev         - Run React web app dev server"
	@echo "  mobile-install  - Run flutter pub get for mobile app"
	@echo "  mobile-analyze  - Run flutter analyze for mobile app"
	@echo "  mobile-test     - Run unit and widget tests for mobile app"
	@echo "  mobile-format   - Format mobile Dart code"
	@echo "  mobile-run      - Run Flutter mobile app"

api-run:
	dotnet watch --project apps/api/HireWise.Api/HireWise.Api.csproj run

api-build:
	dotnet build apps/api/HireWise.Api/HireWise.Api.csproj

web-install:
	cd apps/web && npm install

web-dev:
	cd apps/web && npm run dev

mobile-install:
	cd apps/mobile && flutter pub get

mobile-analyze:
	cd apps/mobile && flutter analyze

mobile-test:
	cd apps/mobile && flutter test

mobile-format:
	cd apps/mobile && dart format .

mobile-run:
	cd apps/mobile && flutter run --dart-define-from-file=env.development.json
