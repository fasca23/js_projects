notebook/
├── build.py
├── collect_files.sh
├── package.json
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── storage.js
│   ├── strokes.js
│   ├── renderer.js
│   ├── input.js
│   ├── toolbar.js
│   ├── notebook.js
│   └── main.js
├── index.html
└── dist/                (создаст build.py)


cd ~/dev/js_games/notebook

# для разработки — открыть index.html в браузере
# или поднять локальный сервер (localStorage работает и с file://, но лучше через сервер)
python3 -m http.server 8080
# → http://localhost:8080/

# сборка
python3 build.py all
# или
npm run build:all

firefox ~/dev/js_projects/notebook/dist/index.html
