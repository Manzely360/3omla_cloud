/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./components/NotificationsHub.tsx":
/*!*****************************************!*\
  !*** ./components/NotificationsHub.tsx ***!
  \*****************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ NotificationsHub)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react_hot_toast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-hot-toast */ \"react-hot-toast\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_hot_toast__WEBPACK_IMPORTED_MODULE_1__]);\nreact_hot_toast__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\nfunction NotificationsHub() {\n    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{\n        const base = \"http://backend:8000\" || 0;\n        const url = `${base}/api/v1/signals/stream`;\n        let es = null;\n        let esWhales = null;\n        try {\n            es = new EventSource(url);\n            es.onmessage = (e)=>{\n                try {\n                    const payload = JSON.parse(e.data);\n                    const msg = `${payload.primary_symbol} ${payload.direction?.toUpperCase() || \"\"} ${payload.signal_type || \"signal\"}`;\n                    react_hot_toast__WEBPACK_IMPORTED_MODULE_1__[\"default\"].success(msg);\n                } catch  {\n                // ignore\n                }\n            };\n            es.onerror = ()=>{\n            // silent reconnect attempts by browser\n            };\n            // whale stream\n            // load threshold from localStorage\n            let minUsd = 200000;\n            try {\n                if (false) {}\n            } catch  {}\n            esWhales = new EventSource(`${base}/api/v1/whales/stream?min_trade_size=${minUsd}`);\n            esWhales.onmessage = (e)=>{\n                try {\n                    const w = JSON.parse(e.data);\n                    if (w && w.symbol && w.usd_notional) {\n                        const side = (w.side || \"\").toUpperCase();\n                        const usd = Math.round((w.usd_notional || 0) / 1000);\n                        (0,react_hot_toast__WEBPACK_IMPORTED_MODULE_1__[\"default\"])(`Whale ${side} ${usd}k ${w.symbol} @ ${w.price}`, {\n                            icon: \"\\uD83D\\uDC0B\"\n                        });\n                    }\n                } catch  {}\n            };\n        } catch  {\n        // ignore\n        }\n        return ()=>{\n            if (es) es.close();\n            if (esWhales) esWhales.close();\n        };\n    }, []);\n    return null;\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb21wb25lbnRzL05vdGlmaWNhdGlvbnNIdWIudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBaUM7QUFDRTtBQUVwQixTQUFTRTtJQUN0QkYsZ0RBQVNBLENBQUM7UUFDUixNQUFNRyxPQUFPQyxxQkFBK0IsSUFBSTtRQUNoRCxNQUFNRyxNQUFNLENBQUMsRUFBRUosS0FBSyxzQkFBc0IsQ0FBQztRQUMzQyxJQUFJSyxLQUF5QjtRQUM3QixJQUFJQyxXQUErQjtRQUNuQyxJQUFJO1lBQ0ZELEtBQUssSUFBSUUsWUFBWUg7WUFDckJDLEdBQUdHLFNBQVMsR0FBRyxDQUFDQztnQkFDZCxJQUFJO29CQUNGLE1BQU1DLFVBQVVDLEtBQUtDLEtBQUssQ0FBQ0gsRUFBRUksSUFBSTtvQkFDakMsTUFBTUMsTUFBTSxDQUFDLEVBQUVKLFFBQVFLLGNBQWMsQ0FBQyxDQUFDLEVBQUVMLFFBQVFNLFNBQVMsRUFBRUMsaUJBQWlCLEdBQUcsQ0FBQyxFQUMvRVAsUUFBUVEsV0FBVyxJQUFJLFNBQ3hCLENBQUM7b0JBQ0ZwQiwrREFBYSxDQUFDZ0I7Z0JBQ2hCLEVBQUUsT0FBTTtnQkFDTixTQUFTO2dCQUNYO1lBQ0Y7WUFDQVQsR0FBR2UsT0FBTyxHQUFHO1lBQ1gsdUNBQXVDO1lBQ3pDO1lBQ0EsZUFBZTtZQUNmLG1DQUFtQztZQUNuQyxJQUFJQyxTQUFTO1lBQ2IsSUFBSTtnQkFBRSxJQUFJLEtBQWtCLEVBQWEsRUFBb0c7WUFBQyxFQUFFLE9BQU0sQ0FBQztZQUN2SmYsV0FBVyxJQUFJQyxZQUFZLENBQUMsRUFBRVAsS0FBSyxxQ0FBcUMsRUFBRXFCLE9BQU8sQ0FBQztZQUNsRmYsU0FBU0UsU0FBUyxHQUFHLENBQUNDO2dCQUNwQixJQUFJO29CQUNGLE1BQU1rQixJQUFJaEIsS0FBS0MsS0FBSyxDQUFDSCxFQUFFSSxJQUFJO29CQUMzQixJQUFJYyxLQUFLQSxFQUFFQyxNQUFNLElBQUlELEVBQUVFLFlBQVksRUFBRTt3QkFDbkMsTUFBTUMsT0FBTyxDQUFDSCxFQUFFRyxJQUFJLElBQUksRUFBQyxFQUFHYixXQUFXO3dCQUN2QyxNQUFNYyxNQUFNQyxLQUFLQyxLQUFLLENBQUMsQ0FBQ04sRUFBRUUsWUFBWSxJQUFFLEtBQUc7d0JBQzNDL0IsMkRBQUtBLENBQUMsQ0FBQyxNQUFNLEVBQUVnQyxLQUFLLENBQUMsRUFBRUMsSUFBSSxFQUFFLEVBQUVKLEVBQUVDLE1BQU0sQ0FBQyxHQUFHLEVBQUVELEVBQUVPLEtBQUssQ0FBQyxDQUFDLEVBQUU7NEJBQUVDLE1BQU07d0JBQUs7b0JBQ3ZFO2dCQUNGLEVBQUUsT0FBTSxDQUFDO1lBQ1g7UUFDRixFQUFFLE9BQU07UUFDTixTQUFTO1FBQ1g7UUFDQSxPQUFPO1lBQ0wsSUFBSTlCLElBQUlBLEdBQUcrQixLQUFLO1lBQ2hCLElBQUk5QixVQUFVQSxTQUFTOEIsS0FBSztRQUM5QjtJQUNGLEdBQUcsRUFBRTtJQUNMLE9BQU87QUFDVCIsInNvdXJjZXMiOlsid2VicGFjazovL2NyeXB0by1sZWFkLWxhZy1yYWRhci1mcm9udGVuZC8uL2NvbXBvbmVudHMvTm90aWZpY2F0aW9uc0h1Yi50c3g/YjAxYyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0b2FzdCBmcm9tICdyZWFjdC1ob3QtdG9hc3QnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIE5vdGlmaWNhdGlvbnNIdWIoKSB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYmFzZSA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0FQSV9VUkwgfHwgJ2h0dHA6Ly9iYWNrZW5kOjgwMDAnXG4gICAgY29uc3QgdXJsID0gYCR7YmFzZX0vYXBpL3YxL3NpZ25hbHMvc3RyZWFtYFxuICAgIGxldCBlczogRXZlbnRTb3VyY2UgfCBudWxsID0gbnVsbFxuICAgIGxldCBlc1doYWxlczogRXZlbnRTb3VyY2UgfCBudWxsID0gbnVsbFxuICAgIHRyeSB7XG4gICAgICBlcyA9IG5ldyBFdmVudFNvdXJjZSh1cmwpXG4gICAgICBlcy5vbm1lc3NhZ2UgPSAoZSkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnBhcnNlKGUuZGF0YSlcbiAgICAgICAgICBjb25zdCBtc2cgPSBgJHtwYXlsb2FkLnByaW1hcnlfc3ltYm9sfSAke3BheWxvYWQuZGlyZWN0aW9uPy50b1VwcGVyQ2FzZSgpIHx8ICcnfSAke1xuICAgICAgICAgICAgcGF5bG9hZC5zaWduYWxfdHlwZSB8fCAnc2lnbmFsJ1xuICAgICAgICAgIH1gXG4gICAgICAgICAgdG9hc3Quc3VjY2Vzcyhtc2cpXG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlcy5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAvLyBzaWxlbnQgcmVjb25uZWN0IGF0dGVtcHRzIGJ5IGJyb3dzZXJcbiAgICAgIH1cbiAgICAgIC8vIHdoYWxlIHN0cmVhbVxuICAgICAgLy8gbG9hZCB0aHJlc2hvbGQgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgICAgIGxldCBtaW5Vc2QgPSAyMDAwMDBcbiAgICAgIHRyeSB7IGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgeyBjb25zdCB2ID0gcGFyc2VJbnQobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3doYWxlX21pbl91c2QnKSB8fCAnMjAwMDAwJyk7IGlmICghaXNOYU4odikpIG1pblVzZCA9IHYgfSB9IGNhdGNoIHt9XG4gICAgICBlc1doYWxlcyA9IG5ldyBFdmVudFNvdXJjZShgJHtiYXNlfS9hcGkvdjEvd2hhbGVzL3N0cmVhbT9taW5fdHJhZGVfc2l6ZT0ke21pblVzZH1gKVxuICAgICAgZXNXaGFsZXMub25tZXNzYWdlID0gKGUpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB3ID0gSlNPTi5wYXJzZShlLmRhdGEpXG4gICAgICAgICAgaWYgKHcgJiYgdy5zeW1ib2wgJiYgdy51c2Rfbm90aW9uYWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHNpZGUgPSAody5zaWRlIHx8ICcnKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICBjb25zdCB1c2QgPSBNYXRoLnJvdW5kKCh3LnVzZF9ub3Rpb25hbHx8MCkvMTAwMClcbiAgICAgICAgICAgIHRvYXN0KGBXaGFsZSAke3NpZGV9ICR7dXNkfWsgJHt3LnN5bWJvbH0gQCAke3cucHJpY2V9YCwgeyBpY29uOiAn8J+QiycgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIGlnbm9yZVxuICAgIH1cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgaWYgKGVzKSBlcy5jbG9zZSgpXG4gICAgICBpZiAoZXNXaGFsZXMpIGVzV2hhbGVzLmNsb3NlKClcbiAgICB9XG4gIH0sIFtdKVxuICByZXR1cm4gbnVsbFxufVxuIl0sIm5hbWVzIjpbInVzZUVmZmVjdCIsInRvYXN0IiwiTm90aWZpY2F0aW9uc0h1YiIsImJhc2UiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfQVBJX1VSTCIsInVybCIsImVzIiwiZXNXaGFsZXMiLCJFdmVudFNvdXJjZSIsIm9ubWVzc2FnZSIsImUiLCJwYXlsb2FkIiwiSlNPTiIsInBhcnNlIiwiZGF0YSIsIm1zZyIsInByaW1hcnlfc3ltYm9sIiwiZGlyZWN0aW9uIiwidG9VcHBlckNhc2UiLCJzaWduYWxfdHlwZSIsInN1Y2Nlc3MiLCJvbmVycm9yIiwibWluVXNkIiwidiIsInBhcnNlSW50IiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsImlzTmFOIiwidyIsInN5bWJvbCIsInVzZF9ub3Rpb25hbCIsInNpZGUiLCJ1c2QiLCJNYXRoIiwicm91bmQiLCJwcmljZSIsImljb24iLCJjbG9zZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./components/NotificationsHub.tsx\n");

/***/ }),

/***/ "./lib/i18n.tsx":
/*!**********************!*\
  !*** ./lib/i18n.tsx ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   LangProvider: () => (/* binding */ LangProvider),\n/* harmony export */   useI18n: () => (/* binding */ useI18n)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _locales_en_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../locales/en.json */ \"./locales/en.json\");\n/* harmony import */ var _locales_ar_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../locales/ar.json */ \"./locales/ar.json\");\n\n\n\n\nconst dictionaries = {\n    en: _locales_en_json__WEBPACK_IMPORTED_MODULE_2__,\n    ar: _locales_ar_json__WEBPACK_IMPORTED_MODULE_3__\n};\nconst Ctx = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(null);\nfunction LangProvider({ children }) {\n    const [lang, setLangState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"en\");\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const saved =  false ? 0 : null;\n        if (saved === \"ar\" || saved === \"en\") setLangState(saved);\n    }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (false) {}\n    }, [\n        lang\n    ]);\n    const setLang = (l)=>setLangState(l);\n    const t = (key, fallback)=>{\n        const dict = dictionaries[lang] || {};\n        return dict[key] || fallback || key;\n    };\n    const value = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(()=>({\n            lang,\n            setLang,\n            t\n        }), [\n        lang\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Ctx.Provider, {\n        value: value,\n        children: children\n    }, void 0, false, {\n        fileName: \"/app/lib/i18n.tsx\",\n        lineNumber: 43,\n        columnNumber: 10\n    }, this);\n}\nfunction useI18n() {\n    const ctx = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(Ctx);\n    if (!ctx) throw new Error(\"useI18n must be used within LangProvider\");\n    return ctx;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvaTE4bi50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQXNGO0FBQ25EO0FBQ0E7QUFLbkMsTUFBTVEsZUFBbUM7SUFBRUYsRUFBRUEsK0NBQUFBO0lBQUVDLEVBQUVBLCtDQUFBQTtBQUFDO0FBUWxELE1BQU1FLG9CQUFNUixvREFBYUEsQ0FBaUI7QUFFbkMsU0FBU1MsYUFBYSxFQUFFQyxRQUFRLEVBQWlDO0lBQ3RFLE1BQU0sQ0FBQ0MsTUFBTUMsYUFBYSxHQUFHUiwrQ0FBUUEsQ0FBTztJQUU1Q0YsZ0RBQVNBLENBQUM7UUFDUixNQUFNVyxRQUFRLE1BQWtCLEdBQWVDLENBQXFCLEdBQTBCO1FBQzlGLElBQUlELFVBQVUsUUFBUUEsVUFBVSxNQUFNRCxhQUFhQztJQUNyRCxHQUFHLEVBQUU7SUFFTFgsZ0RBQVNBLENBQUM7UUFDUixJQUFJLEtBQWtCLEVBQWEsRUFLbEM7SUFDSCxHQUFHO1FBQUNTO0tBQUs7SUFFVCxNQUFNVSxVQUFVLENBQUNDLElBQVlWLGFBQWFVO0lBRTFDLE1BQU1DLElBQUksQ0FBQ0MsS0FBYUM7UUFDdEIsTUFBTUMsT0FBT25CLFlBQVksQ0FBQ0ksS0FBSyxJQUFJLENBQUM7UUFDcEMsT0FBT2UsSUFBSSxDQUFDRixJQUFJLElBQUlDLFlBQVlEO0lBQ2xDO0lBRUEsTUFBTUcsUUFBUXhCLDhDQUFPQSxDQUFDLElBQU87WUFBRVE7WUFBTVU7WUFBU0U7UUFBRSxJQUFJO1FBQUNaO0tBQUs7SUFDMUQscUJBQU8sOERBQUNILElBQUlvQixRQUFRO1FBQUNELE9BQU9BO2tCQUFRakI7Ozs7OztBQUN0QztBQUVPLFNBQVNtQjtJQUNkLE1BQU1DLE1BQU03QixpREFBVUEsQ0FBQ087SUFDdkIsSUFBSSxDQUFDc0IsS0FBSyxNQUFNLElBQUlDLE1BQU07SUFDMUIsT0FBT0Q7QUFDVCIsInNvdXJjZXMiOlsid2VicGFjazovL2NyeXB0by1sZWFkLWxhZy1yYWRhci1mcm9udGVuZC8uL2xpYi9pMThuLnRzeD9hZGI1Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyBjcmVhdGVDb250ZXh0LCB1c2VDb250ZXh0LCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgZW4gZnJvbSAnLi4vbG9jYWxlcy9lbi5qc29uJ1xuaW1wb3J0IGFyIGZyb20gJy4uL2xvY2FsZXMvYXIuanNvbidcblxudHlwZSBMYW5nID0gJ2VuJyB8ICdhcidcbnR5cGUgRGljdCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cblxuY29uc3QgZGljdGlvbmFyaWVzOiBSZWNvcmQ8TGFuZywgRGljdD4gPSB7IGVuLCBhciB9XG5cbnR5cGUgSTE4bkN0eCA9IHtcbiAgbGFuZzogTGFuZ1xuICBzZXRMYW5nOiAobDogTGFuZykgPT4gdm9pZFxuICB0OiAoa2V5OiBzdHJpbmcsIGZhbGxiYWNrPzogc3RyaW5nKSA9PiBzdHJpbmdcbn1cblxuY29uc3QgQ3R4ID0gY3JlYXRlQ29udGV4dDxJMThuQ3R4IHwgbnVsbD4obnVsbClcblxuZXhwb3J0IGZ1bmN0aW9uIExhbmdQcm92aWRlcih7IGNoaWxkcmVuIH06IHsgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZSB9KSB7XG4gIGNvbnN0IFtsYW5nLCBzZXRMYW5nU3RhdGVdID0gdXNlU3RhdGU8TGFuZz4oJ2VuJylcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHNhdmVkID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2xhbmcnKSBhcyBMYW5nIHwgbnVsbCkgOiBudWxsXG4gICAgaWYgKHNhdmVkID09PSAnYXInIHx8IHNhdmVkID09PSAnZW4nKSBzZXRMYW5nU3RhdGUoc2F2ZWQpXG4gIH0sIFtdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnbGFuZycsIGxhbmcpXG4gICAgICBjb25zdCBkaXIgPSBsYW5nID09PSAnYXInID8gJ3J0bCcgOiAnbHRyJ1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGlyJywgZGlyKVxuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZSgnbGFuZycsIGxhbmcpXG4gICAgfVxuICB9LCBbbGFuZ10pXG5cbiAgY29uc3Qgc2V0TGFuZyA9IChsOiBMYW5nKSA9PiBzZXRMYW5nU3RhdGUobClcblxuICBjb25zdCB0ID0gKGtleTogc3RyaW5nLCBmYWxsYmFjaz86IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGRpY3QgPSBkaWN0aW9uYXJpZXNbbGFuZ10gfHwge31cbiAgICByZXR1cm4gZGljdFtrZXldIHx8IGZhbGxiYWNrIHx8IGtleVxuICB9XG5cbiAgY29uc3QgdmFsdWUgPSB1c2VNZW1vKCgpID0+ICh7IGxhbmcsIHNldExhbmcsIHQgfSksIFtsYW5nXSlcbiAgcmV0dXJuIDxDdHguUHJvdmlkZXIgdmFsdWU9e3ZhbHVlfT57Y2hpbGRyZW59PC9DdHguUHJvdmlkZXI+XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VJMThuKCkge1xuICBjb25zdCBjdHggPSB1c2VDb250ZXh0KEN0eClcbiAgaWYgKCFjdHgpIHRocm93IG5ldyBFcnJvcigndXNlSTE4biBtdXN0IGJlIHVzZWQgd2l0aGluIExhbmdQcm92aWRlcicpXG4gIHJldHVybiBjdHhcbn1cblxuIl0sIm5hbWVzIjpbIlJlYWN0IiwiY3JlYXRlQ29udGV4dCIsInVzZUNvbnRleHQiLCJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwidXNlU3RhdGUiLCJlbiIsImFyIiwiZGljdGlvbmFyaWVzIiwiQ3R4IiwiTGFuZ1Byb3ZpZGVyIiwiY2hpbGRyZW4iLCJsYW5nIiwic2V0TGFuZ1N0YXRlIiwic2F2ZWQiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsImRpciIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwic2V0TGFuZyIsImwiLCJ0Iiwia2V5IiwiZmFsbGJhY2siLCJkaWN0IiwidmFsdWUiLCJQcm92aWRlciIsInVzZUkxOG4iLCJjdHgiLCJFcnJvciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./lib/i18n.tsx\n");

/***/ }),

/***/ "./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react_query__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-query */ \"react-query\");\n/* harmony import */ var react_query__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_query__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_query_devtools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-query/devtools */ \"react-query/devtools\");\n/* harmony import */ var react_query_devtools__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_query_devtools__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var react_hot_toast__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-hot-toast */ \"react-hot-toast\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _components_NotificationsHub__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/NotificationsHub */ \"./components/NotificationsHub.tsx\");\n/* harmony import */ var _lib_i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../lib/i18n */ \"./lib/i18n.tsx\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_hot_toast__WEBPACK_IMPORTED_MODULE_3__, _components_NotificationsHub__WEBPACK_IMPORTED_MODULE_5__]);\n([react_hot_toast__WEBPACK_IMPORTED_MODULE_3__, _components_NotificationsHub__WEBPACK_IMPORTED_MODULE_5__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n\n\nconst queryClient = new react_query__WEBPACK_IMPORTED_MODULE_1__.QueryClient({\n    defaultOptions: {\n        queries: {\n            refetchOnWindowFocus: false,\n            retry: 1,\n            staleTime: 5 * 60 * 1000\n        }\n    }\n});\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_query__WEBPACK_IMPORTED_MODULE_1__.QueryClientProvider, {\n        client: queryClient,\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_lib_i18n__WEBPACK_IMPORTED_MODULE_6__.LangProvider, {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                        ...pageProps\n                    }, void 0, false, {\n                        fileName: \"/app/pages/_app.tsx\",\n                        lineNumber: 23,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_NotificationsHub__WEBPACK_IMPORTED_MODULE_5__[\"default\"], {}, void 0, false, {\n                        fileName: \"/app/pages/_app.tsx\",\n                        lineNumber: 24,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/app/pages/_app.tsx\",\n                lineNumber: 22,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_hot_toast__WEBPACK_IMPORTED_MODULE_3__.Toaster, {\n                position: \"top-right\",\n                toastOptions: {\n                    duration: 4000,\n                    style: {\n                        background: \"#1f2937\",\n                        color: \"#f9fafb\",\n                        border: \"1px solid #374151\"\n                    }\n                }\n            }, void 0, false, {\n                fileName: \"/app/pages/_app.tsx\",\n                lineNumber: 26,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_query_devtools__WEBPACK_IMPORTED_MODULE_2__.ReactQueryDevtools, {\n                initialIsOpen: false\n            }, void 0, false, {\n                fileName: \"/app/pages/_app.tsx\",\n                lineNumber: 37,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/app/pages/_app.tsx\",\n        lineNumber: 21,\n        columnNumber: 5\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQzhEO0FBQ0w7QUFDaEI7QUFDWDtBQUMrQjtBQUNuQjtBQUUxQyxNQUFNTSxjQUFjLElBQUlOLG9EQUFXQSxDQUFDO0lBQ2xDTyxnQkFBZ0I7UUFDZEMsU0FBUztZQUNQQyxzQkFBc0I7WUFDdEJDLE9BQU87WUFDUEMsV0FBVyxJQUFJLEtBQUs7UUFDdEI7SUFDRjtBQUNGO0FBRWUsU0FBU0MsSUFBSSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBWTtJQUM1RCxxQkFDRSw4REFBQ2IsNERBQW1CQTtRQUFDYyxRQUFRVDs7MEJBQzNCLDhEQUFDRCxtREFBWUE7O2tDQUNYLDhEQUFDUTt3QkFBVyxHQUFHQyxTQUFTOzs7Ozs7a0NBQ3hCLDhEQUFDVixvRUFBZ0JBOzs7Ozs7Ozs7OzswQkFFbkIsOERBQUNELG9EQUFPQTtnQkFDTmEsVUFBUztnQkFDVEMsY0FBYztvQkFDWkMsVUFBVTtvQkFDVkMsT0FBTzt3QkFDTEMsWUFBWTt3QkFDWkMsT0FBTzt3QkFDUEMsUUFBUTtvQkFDVjtnQkFDRjs7Ozs7OzBCQUVGLDhEQUFDcEIsb0VBQWtCQTtnQkFBQ3FCLGVBQWU7Ozs7Ozs7Ozs7OztBQUd6QyIsInNvdXJjZXMiOlsid2VicGFjazovL2NyeXB0by1sZWFkLWxhZy1yYWRhci1mcm9udGVuZC8uL3BhZ2VzL19hcHAudHN4PzJmYmUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBcHBQcm9wcyB9IGZyb20gJ25leHQvYXBwJ1xuaW1wb3J0IHsgUXVlcnlDbGllbnQsIFF1ZXJ5Q2xpZW50UHJvdmlkZXIgfSBmcm9tICdyZWFjdC1xdWVyeSdcbmltcG9ydCB7IFJlYWN0UXVlcnlEZXZ0b29scyB9IGZyb20gJ3JlYWN0LXF1ZXJ5L2RldnRvb2xzJ1xuaW1wb3J0IHsgVG9hc3RlciB9IGZyb20gJ3JlYWN0LWhvdC10b2FzdCdcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJ1xuaW1wb3J0IE5vdGlmaWNhdGlvbnNIdWIgZnJvbSAnLi4vY29tcG9uZW50cy9Ob3RpZmljYXRpb25zSHViJ1xuaW1wb3J0IHsgTGFuZ1Byb3ZpZGVyIH0gZnJvbSAnLi4vbGliL2kxOG4nXG5cbmNvbnN0IHF1ZXJ5Q2xpZW50ID0gbmV3IFF1ZXJ5Q2xpZW50KHtcbiAgZGVmYXVsdE9wdGlvbnM6IHtcbiAgICBxdWVyaWVzOiB7XG4gICAgICByZWZldGNoT25XaW5kb3dGb2N1czogZmFsc2UsXG4gICAgICByZXRyeTogMSxcbiAgICAgIHN0YWxlVGltZTogNSAqIDYwICogMTAwMCwgLy8gNSBtaW51dGVzXG4gICAgfSxcbiAgfSxcbn0pXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFF1ZXJ5Q2xpZW50UHJvdmlkZXIgY2xpZW50PXtxdWVyeUNsaWVudH0+XG4gICAgICA8TGFuZ1Byb3ZpZGVyPlxuICAgICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XG4gICAgICAgIDxOb3RpZmljYXRpb25zSHViIC8+XG4gICAgICA8L0xhbmdQcm92aWRlcj5cbiAgICAgIDxUb2FzdGVyXG4gICAgICAgIHBvc2l0aW9uPVwidG9wLXJpZ2h0XCJcbiAgICAgICAgdG9hc3RPcHRpb25zPXt7XG4gICAgICAgICAgZHVyYXRpb246IDQwMDAsXG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjMWYyOTM3JyxcbiAgICAgICAgICAgIGNvbG9yOiAnI2Y5ZmFmYicsXG4gICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgIzM3NDE1MScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8UmVhY3RRdWVyeURldnRvb2xzIGluaXRpYWxJc09wZW49e2ZhbHNlfSAvPlxuICAgIDwvUXVlcnlDbGllbnRQcm92aWRlcj5cbiAgKVxufVxuIl0sIm5hbWVzIjpbIlF1ZXJ5Q2xpZW50IiwiUXVlcnlDbGllbnRQcm92aWRlciIsIlJlYWN0UXVlcnlEZXZ0b29scyIsIlRvYXN0ZXIiLCJOb3RpZmljYXRpb25zSHViIiwiTGFuZ1Byb3ZpZGVyIiwicXVlcnlDbGllbnQiLCJkZWZhdWx0T3B0aW9ucyIsInF1ZXJpZXMiLCJyZWZldGNoT25XaW5kb3dGb2N1cyIsInJldHJ5Iiwic3RhbGVUaW1lIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwiY2xpZW50IiwicG9zaXRpb24iLCJ0b2FzdE9wdGlvbnMiLCJkdXJhdGlvbiIsInN0eWxlIiwiYmFja2dyb3VuZCIsImNvbG9yIiwiYm9yZGVyIiwiaW5pdGlhbElzT3BlbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./pages/_app.tsx\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-query":
/*!******************************!*\
  !*** external "react-query" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-query");

/***/ }),

/***/ "react-query/devtools":
/*!***************************************!*\
  !*** external "react-query/devtools" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-query/devtools");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react-hot-toast":
/*!**********************************!*\
  !*** external "react-hot-toast" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = import("react-hot-toast");;

/***/ }),

/***/ "./locales/ar.json":
/*!*************************!*\
  !*** ./locales/ar.json ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"app.title":"رادار أنماط القيادة والتأخر للعملات الرقمية","nav.dashboard":"الصفحة الرئيسية","nav.trading":"التداول","nav.analytics":"التحليلات","nav.signals":"الإشارات","nav.leadlag":"القيادة/التأخر","nav.correlations":"الارتباطات","nav.charts":"الرسوم البيانية","nav.orderbook":"دفتر الأوامر","nav.backtesting":"اختبار رجعي","nav.alerts":"التنبيهات","nav.market":"بيانات السوق","nav.settings":"الإعدادات","header.search.placeholder":"ابحث عن الرموز أو الإشارات أو التحليلات...","header.login":"تسجيل الدخول","dashboard.title":"رادار أنماط القيادة والتأخر للعملات الرقمية","dashboard.subtitle":"اكتشاف علاقات العملات الرقمية وإشارات التداول لحظيًا","section.activeSignals":"الإشارات النشطة","section.marketOverview":"نظرة عامة على السوق","section.correlationMatrix":"مصفوفة الارتباط","section.leadlagNetwork":"شبكة القيادة/التأخر","trading.title":"لوحة التداول","settings.title":"الإعدادات","settings.exchangeConnections":"اتصالات البورصات","settings.provider":"المزود","settings.apiKey":"مفتاح API","settings.apiSecret":"سر API","settings.save":"حفظ والاتصال","lang.english":"الإنجليزية","lang.arabic":"العربية"}');

/***/ }),

/***/ "./locales/en.json":
/*!*************************!*\
  !*** ./locales/en.json ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"app.title":"Crypto Lead-Lag Pattern Radar","nav.dashboard":"Dashboard","nav.trading":"Trading","nav.analytics":"Analytics","nav.signals":"Signals","nav.leadlag":"Lead-Lag","nav.correlations":"Correlations","nav.charts":"Charts","nav.orderbook":"Order Book","nav.backtesting":"Backtesting","nav.alerts":"Alerts","nav.market":"Market Data","nav.settings":"Settings","header.search.placeholder":"Search symbols, signals, or analytics...","header.login":"Login","dashboard.title":"Crypto Lead-Lag Pattern Radar","dashboard.subtitle":"Real-time cryptocurrency relationship detection and trading signals","section.activeSignals":"Active Signals","section.marketOverview":"Market Overview","section.correlationMatrix":"Correlation Matrix","section.leadlagNetwork":"Lead-Lag Network","trading.title":"Trading Dashboard","settings.title":"Settings","settings.exchangeConnections":"Exchange Connections","settings.provider":"Provider","settings.apiKey":"API Key","settings.apiSecret":"API Secret","settings.save":"Save & Connect","lang.english":"English","lang.arabic":"Arabic"}');

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.tsx"));
module.exports = __webpack_exports__;

})();