# 📧 Configuration des Emails Supabase

## Problème actuel

Actuellement, les utilisateurs ne reçoivent pas d'email de confirmation lors de l'inscription. Cela empêche la connexion avec le message "Email non confirmé".

## Solution : 2 Options

### Option 1 : Désactiver la confirmation email (Recommandé pour dev/test)

**Avantages :** Rapide, pas de configuration email nécessaire
**Inconvénients :** Moins sécurisé pour la production

#### Étapes :

1. Va sur **https://supabase.com/dashboard**
2. Sélectionne ton projet **Smart Stop**
3. Va dans **Authentication** > **Providers** (menu de gauche)
4. Clique sur **Email** dans la liste des providers
5. Désactive **"Confirm email"** (toggle à OFF)
6. Clique sur **Save**

Maintenant, les utilisateurs peuvent se connecter immédiatement après l'inscription, sans email de confirmation.

---

### Option 2 : Configurer un service email (Recommandé pour production)

**Avantages :** Sécurisé, professionnel
**Inconvénients :** Nécessite configuration

#### A. Avec Gmail (Gratuit, facile)

1. Va sur **https://supabase.com/dashboard**
2. Sélectionne ton projet
3. Va dans **Project Settings** > **Auth** > **SMTP Settings**
4. Active **"Enable Custom SMTP"**
5. Configure :
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: ton-email@gmail.com
   Password: [Mot de passe d'application Gmail]
   Sender email: ton-email@gmail.com
   Sender name: Smart Stop
   ```

**⚠️ Important pour Gmail :**
- Active la validation en 2 étapes sur ton compte Gmail
- Crée un **mot de passe d'application** : https://myaccount.google.com/apppasswords
- Utilise ce mot de passe d'application (pas ton mot de passe Gmail)

#### B. Avec SendGrid (Recommandé pour production)

1. Crée un compte gratuit sur **https://sendgrid.com** (100 emails/jour gratuits)
2. Crée une **API Key** dans SendGrid
3. Dans Supabase :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Ta SendGrid API Key]
   Sender email: noreply@ton-domaine.com
   Sender name: Smart Stop
   ```

#### C. Avec Resend (Alternative moderne)

1. Crée un compte sur **https://resend.com** (100 emails/jour gratuits)
2. Obtiens ton **API Key**
3. Configure dans Supabase avec les paramètres Resend

---

## Test de configuration

Une fois configuré :

1. **Teste l'inscription** : Crée un nouveau compte
2. **Vérifie ta boîte mail** (regarde aussi les spams)
3. **Clique sur le lien** de confirmation
4. **Connecte-toi** avec tes identifiants

---

## Email Templates (Optionnel - personnalisation)

Tu peux personnaliser les emails dans **Authentication** > **Email Templates** :

### Templates disponibles :
- **Confirm signup** - Email de confirmation d'inscription
- **Invite user** - Invitation d'utilisateur
- **Magic Link** - Lien de connexion magique
- **Change Email Address** - Changement d'email
- **Reset Password** - Réinitialisation mot de passe

### Variables disponibles :
- `{{ .ConfirmationURL }}` - Lien de confirmation
- `{{ .Email }}` - Email de l'utilisateur
- `{{ .Token }}` - Token de confirmation
- `{{ .SiteURL }}` - URL de ton site

---

## 🎯 Recommandation

**Pour commencer rapidement :** Utilise l'**Option 1** (désactiver la confirmation)

**Pour la production :** Configure l'**Option 2** avec SendGrid ou Resend

---

## Besoin d'aide ?

Si tu as des problèmes :
1. Vérifie les logs dans Supabase : **Authentication** > **Logs**
2. Teste l'envoi d'email de test dans **SMTP Settings**
3. Vérifie que ton domaine est vérifié (pour certains services)
