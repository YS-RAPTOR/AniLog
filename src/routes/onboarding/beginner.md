## 01 | Setup MAL Credentials

1.  First login to MyAnimeList and go to the website below to create an API application.

```json
{
    "type": "button",
    "variant": "external",
    "label": "Open MAL API Settings",
    "url": "https://myanimelist.net/apiconfig"
}
```

2.  Click on the blue `Create ID` button on the bottom right of the center panel.
3.  Fill in the `App Name` as "AniLog" or any other name you prefer.
4.  Make sure to set the `App Type` to `other`.
5.  You can put anything you like in the `App Description` field (Make sure it is at least 50 characters long).
6.  The `App Redirect URL` will be the following values:

```json
{
    "type": "copy",
    "mode": "multi",
    "label": "Callback URLs",
    "values": [
        "http://127.0.0.1:2003/oauth/mal/callback",
        "http://127.0.0.1:2030/oauth/mal/callback",
        "http://127.0.0.1:2300/oauth/mal/callback",
        "http://127.0.0.1:3002/oauth/mal/callback",
        "http://127.0.0.1:3020/oauth/mal/callback",
        "http://127.0.0.1:3200/oauth/mal/callback",
        "anilog://oauth/mal/callback"
    ]
}
```

7. The `Homepage URL` can be set to the following value or any other URL you prefer:

```json
{
    "type": "copy",
    "mode": "single",
    "label": "Homepage URL",
    "value": "https://github.com/YS-RAPTOR/AniLog"
}
```

8. The `Commercial / Non-Commercial` should be set to `Non-Commercial`.
9. The `Name / Company Name` can be set to your name.
10. The `Purpose of Use` should be set to `hobbyist`.
11. Then accept the `API License and Developer Agreement` and click on the blue `Submit` button at the bottom of the form.
12. If you see `Successfully registered` that means the setup was done correctly. If you don't see this message restart from step 1 and make sure to fill in all the fields correctly.
13. Then click on the `Return to list` link.
14. You will now see the name you used appearing under `Clients Accessing the MAL API`.
15. Click on the `Edit` link on the right of the name you just created.
16. Paste the `Client ID` value into the field below and continue to the next step.

```json
{
    "type": "input",
    "key": "malClientId",
    "label": "MAL Client ID",
    "placeholder": "Paste MAL client ID"
}
```

17. You are now done with the MAL setup.

## 02 | Setup Google Credentials

1. Make sure you are logged in to your Google account and go to the website below to create an API application.

```json
{
    "type": "button",
    "variant": "external",
    "label": "Open Google Cloud Console",
    "url": "https://console.cloud.google.com/apis/credentials"
}
```

2. In the top left corner click on the `Select a project` button.
3. Then click on the `New Project` button on the top right corner of the pop-up.
4. Set the `Project Name` to "AniLog" or any other name you prefer and click on the `Create` button (It is fine to leave the `Parent resource` field as `No organization`).
5. In the left sidebar click on `OAuth consent screen` and click on the `Get started` button.
6. The `App name` can be set to "AniLog" or any other name you prefer and the `User support email` can be set to your email.
7. The `Audience` must be set to `External` and click on the `Next` button.
8. For the `Contact information` you can put your email and click on the `Next` button.
9. Click on the check box to `agree to the Google API Services: User Data Policy` and click on the `Continue` button and then click on the `Create` button.
10. You will then see a button called `Create OAuth client`. Click on this button under `Metrics`.
11. The `Application type` should be set to `Desktop app` and the `Name` can be set to "AniLog-Desktop" or any other name you prefer.
12. Then click on the `Create` button.
13. On the pop-up you will see the `Client ID` and `Client secret` values. Paste these values into the fields below and continue to the next step.

```json
{
    "type": "input",
    "key": "googleClientId",
    "label": "Google Client ID",
    "placeholder": "Paste Google client ID"
}
```

```json
{
    "type": "input",
    "key": "googleClientSecret",
    "label": "Google Client Secret",
    "placeholder": "Paste Google client secret"
}
```

14. Then click on the `OK` button.
15. On the left sidebar click on the `Audience` tab and click on the `Add users` button under `Test users`.
16. Add your email to the field and click on the `Save` button.
17. Then click on the `Data Access` tab on the left sidebar.
18. Click on the `Add or remove scopes` button.
19. Add the following scopes under the `Manually add scopes` section and click on the `Update` button.

```json
{
    "type": "copy",
    "mode": "single",
    "label": "Scopes",
    "value": "https://www.googleapis.com/auth/drive.appdata,https://www.googleapis.com/auth/youtube"
}
```

20. You are now done with the Google setup.

## 03 | Review and Continue

Confirm the credentials above, then continue to AniLog to sign in with your MAL and Google accounts

```json
{
    "type": "button",
    "variant": "primary",
    "label": "Validate & Continue",
    "action": "validateContinue"
}
```
