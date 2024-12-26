# API Client

Утилита для работы с API во внутреннем контуре с ограниченным доступом в интернет.

API подгружаются из `config.yaml`
```yaml
sources:
  - name: Credinform
    base_url: https://restapi.credinform.ru/api
    endpoints:
      - name: Balance Sheets
        url: /CompanyInformation/BalanceSheets
        headers: {}
        params:
          apiVersion: "1.9"
        body:
          isWithExtendedForms: false
          period:
            from: "2020-01-01T00:00:00"
            to: "2024-12-31T23:59.59"
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
