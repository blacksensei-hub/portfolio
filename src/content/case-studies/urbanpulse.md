---
project: urbanpulse
headline: A streetwear store that sells the cloth, not just the clothes.
role: Full-stack. Design, storefront, admin, API, and deployment.
period: Jun to Sep 2026
platforms:
  - Web storefront
  - Installable PWA
  - Admin dashboard
metrics:
  - value: '18'
    label: Admin screens for running the store
  - value: '3'
    label: Ways to pay, all in cedis
  - value: '4'
    label: Loyalty tiers
  - value: '14'
    label: API areas behind the store
gallery:
  - image: ../../assets/case-studies/urbanpulse/new-in-rotation.webp
    alt: UrbanPulse homepage section titled New in rotation, with a yellow Ghana jersey and baggy jeans.
    caption: New in rotation, straight from the catalogue.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/the-cloth.webp
    alt: Section titled Before it is a garment, with close-up photos of folded fabric and knit.
    caption: The homepage sells the fabric before the product.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/product-page.webp
    alt: Product page for a yellow Ghana jersey priced at GH₵ 120.00, with colour, size, and an add to cart button.
    caption: Product page, priced in cedis, with size, stock, and delivery promises up front.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/shop-filters.webp
    alt: Shop page titled Everything in rotation, with category, price, and size filters beside the products.
    caption: The shop, filterable by category, price, size, colour, and stock.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/lookbook.webp
    alt: Lookbook page with three editorial story cards.
    caption: The lookbook, for campaign stories and field guides.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/phone-hero.webp
    alt: UrbanPulse homepage on a phone, headline Built for the street. Made to last.
    device: phone
  - image: ../../assets/case-studies/urbanpulse/phone-weight-demo.webp
    alt: The Feel the difference fabric weight demo on a phone, showing 180 GSM and a press and hold button.
    device: phone
  - image: ../../assets/case-studies/urbanpulse/phone-shop.webp
    alt: The shop on a phone, with a filters button and two products.
    device: phone
  - image: ../../assets/case-studies/urbanpulse/phone-new-in.webp
    alt: The New in rotation section on a phone.
    device: phone
---

## The brief

UrbanPulse makes heavyweight streetwear, cut in Accra. Its customers pay with mobile money as often as with a card, and a lot of them would rather pay when the parcel arrives. The store had to make the quality come across through a screen, take payment the way Ghanaians actually pay, and be something the team can run day to day without calling a developer.

## Selling the cloth

Most online stores show a product and a price. UrbanPulse's best argument is the fabric: 320 grams per square metre, nearly double a fast-fashion tee. So the homepage opens with a short film that plays as you scroll, from Accra at dusk down to the weave itself, and a press-and-hold demo lets you feel the weight climb from 180 to 320. The lookbook carries the brand's stories, and the shop does the practical work: filters for category, price, size, colour, and stock.

## Paying in cedis

Checkout supports mobile money and card through Paystack, and cash on delivery. Every price is formatted in cedis in one place, so the amount you see is always the amount you pay. Payment confirmations arrive by webhook, and the server checks each one's signature before it trusts it, so an order is only marked paid when Paystack says it was.

## Running the store

Behind the storefront is an admin with eighteen screens. A Today view shows what needs doing first: orders to pack, returns awaiting approval. Beyond that there are orders, products, customers, coupons, returns, content pages, email templates, analytics, and activity logs. Business rules such as loyalty earn rates live in settings, not in code.

Customers get accounts with order history, returns, saved addresses, a wishlist, PDF receipts, and optional two-factor sign-in. Loyalty points build through four tiers, from bronze to platinum, and referrals earn store credit.

## Findable and trustworthy

The store has structured data and a sitemap, so products can show up properly in search. It also follows Ghana's Data Protection Act: cookie consent that means it, plus letting customers export their data or delete their account.

## The hard parts

- **Sign-in across two domains.** The storefront and the API ran on separate domains, so browsers treated the login cookie as third-party and dropped it. Nobody could stay signed in in production. I routed the API through the storefront's own domain, which made the cookie first-party and fixed it.
- **The offline page that wouldn't go away.** The installable app was serving its offline page for real pages it simply hadn't cached yet. It now falls back to the app itself and only shows the offline page when there really is no connection.
- **Products hiding from their own category.** A filter was case-sensitive, so "Tops" and "tops" were different categories. Category names are now normalised every time a product is saved.
- **Nothing made up.** Before launch I replaced every placeholder: the About story, FAQ answers rewritten to match what the store actually does, and a homepage grid that now shows real products instead of invented ones.

## Stack

- **Storefront:** React, Vite, Tailwind CSS, TanStack Query, Zustand, Framer Motion, and an installable PWA.
- **API:** Node.js and Express on PostgreSQL, Paystack for payments, Cloudinary for images, email notifications, PDF receipts, TOTP two-factor sign-in, and Sentry for errors.
