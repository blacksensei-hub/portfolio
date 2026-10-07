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
  - value: '3'
    label: Ways to pay, all in cedis
  - value: '16'
    label: Regions, each with its own delivery rate
  - value: '0'
    label: IP addresses kept to count visits
  - value: 5.9s → 3.0s
    label: First paint on a slow phone connection
gallery:
  - image: ../../assets/case-studies/urbanpulse/product-page.webp
    alt: Editorial product page for the Ghana jersey, with a full-width photo of the yellow jersey and the name Jersey in large type.
    caption: Featured products get an editorial layout, led by the photograph.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/app-bag-bundle.webp
    alt: 'The bag drawer with one jersey in size L, a suggestion to add the baggy jeans and save GH₵ 20.00 on the Match-day fit for GH₵ 160.00, and a checkout button for GH₵ 120.00.'
    caption: One piece short of a bundle, the bag says what's missing and what it would save.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/app-checkout.webp
    alt: 'Checkout with a saved Kumasi address, and an order summary charging GH₵ 40.00 delivery to the Ashanti region plus VAT.'
    caption: Delivery priced by region, here Ashanti's rate for a Kumasi address.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/size-guide.webp
    alt: Size guide sheet for the baggy jeans, with waist, hip, inseam, and leg opening in centimetres for sizes 28 to 36, the selected size marked, and a fit note.
    caption: The size guide gives the garment's own measurements, not a generic chart.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/notify-me.webp
    alt: 'A sheet titled Get told when it''s back, for the baggy jeans in sold-out size 36, asking for an email address and an optional phone number.'
    caption: A sold-out size offers one message when it's back, and nothing else.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/track-order.webp
    alt: 'A page titled Where''s my order?, asking for the order number and the email or phone number it was placed with. No account is needed.'
    caption: Order tracking without an account. It shows the status and dates, never the address.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/app-admin-today.webp
    alt: 'Admin Today view with today''s and the last seven days'' revenue, orders ready to ship with Mark shipped buttons, and returns waiting for review.'
    caption: 'The admin Today view: what needs doing first.'
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/app-admin-drops.webp
    alt: Admin drop list with 155 email and 51 SMS subscribers, 40 of them new this week, a composer for one announcement by email or SMS, a welcome offer, and recent sign-ups.
    caption: Write a drop announcement once, and send it by email, SMS, or both.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/app-admin-visitors.webp
    alt: Admin visitors panel with 3,092 visits and 9,726 page views over 30 days, a daily chart with a spike after a restock, visit sources led by Instagram, the most viewed pages, and devices.
    caption: Visit counts the store keeps itself, with no IP addresses and no tracking cookies.
    device: desktop
    card: true
  - image: ../../assets/case-studies/urbanpulse/app-admin-product.webp
    alt: Admin product form for the jersey, with stock for each size, a note that 9 people are waiting for the sold-out XXL, and a size chart editor.
    caption: The product form shows how many people are waiting for each size.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/app-admin-bundles.webp
    alt: 'Admin settings with delivery rates for regions such as Upper East, Bono, and Ahafo, and a Match-day fit bundle of the jersey and baggy jeans for GH₵ 160, saving GH₵ 20.'
    caption: Region rates and bundles live in settings, not in code.
    device: desktop
  - image: ../../assets/case-studies/urbanpulse/phone-product.webp
    alt: The jersey product page on a phone, with a full-width photo under a floating, frosted navigation bar.
    device: phone
  - image: ../../assets/case-studies/urbanpulse/phone-bag.webp
    alt: The bag on a phone, suggesting the baggy jeans to complete the Match-day fit and save GH₵ 20.00.
    device: phone
  - image: ../../assets/case-studies/urbanpulse/phone-size-guide.webp
    alt: The size guide on a phone, as a sheet over the product page with the baggy jeans measurements.
    device: phone
    card: true
  - image: ../../assets/case-studies/urbanpulse/phone-notify-me.webp
    alt: The restock sheet on a phone for the baggy jeans in sold-out size 36.
    device: phone
---

## The brief

UrbanPulse makes heavyweight streetwear, cut in Accra. Its customers pay with mobile money as often as with a card, and a lot of them would rather pay when the parcel arrives. The store had to make the quality come across through a screen, take payment the way Ghanaians actually pay, and be something the team can run day to day without calling a developer.

## Selling the cloth

Most online stores show a product and a price. UrbanPulse's best argument is the fabric: 320 grams per square metre, nearly double a fast-fashion tee. So the homepage opens with a short film that plays as you scroll, from Accra at dusk down to the weave itself, and a press-and-hold demo lets you feel the weight climb from 180 to 320. Featured products get an editorial page led by the photograph, and the size guide gives each garment's own measurements rather than a generic chart.

## Feeling like an app

Streetwear gets bought on phones, so the store should feel like an app in the hand. Every animation is a spring tuned by how quickly it settles, so drawers and sheets stop dead instead of wobbling after a tap, and they only bounce when you flick them. A drawer swiped shut carries on at the speed of your finger. The navigation bars are frosted glass that lifts once content passes beneath it, and they turn solid for anyone whose phone asks for less transparency or more contrast.

## Paying in cedis

Checkout supports mobile money and card through Paystack, and cash on delivery. Every price is formatted in cedis in one place, so the amount you see is always the amount you pay. Payment confirmations arrive by webhook, and the server checks each one's signature before it trusts it, so an order is only marked paid when Paystack says it was.

Delivery can be priced for each of Ghana's 16 regions, and checkout asks for your region and an optional GhanaPost GPS address instead of a US state and ZIP code. Bundles, such as a jersey with jeans, are priced on the server, and the storefront mirrors that maths exactly. The saving is stored on the order, so receipts, emails, and loyalty points all agree about it.

## Not losing the sale

A sold-out size used to be a dead end. Now it offers to send one message, by email or text, the moment that size is restocked, and the admin can see how many people are waiting for each size. Fans can join a drop list by email or SMS. The team writes each announcement once and sends it in small batches that pick up where they left off if the tab closes, and every message carries a link to unsubscribe. Anyone can check where their order is with just the order number and the email or phone they used, no account needed. Product pages and tracking results can open a WhatsApp chat with the product or order already filled in.

## Running the store

Behind the storefront is an admin for the whole shop. A Today view shows what needs doing first: orders to pack, returns awaiting approval. Beyond that there are orders, products, customers, coupons, returns, the drop list, content pages, email templates, analytics, and activity logs. Business rules such as delivery rates, bundles, and loyalty earn rates live in settings, not in code.

Customers get accounts with order history, returns, saved addresses, a wishlist, PDF receipts, and optional two-factor sign-in. Loyalty points build through four tiers, from bronze to platinum, and referrals earn store credit.

## Findable and trustworthy

The store has structured data and a sitemap, so products can show up properly in search. It also follows Ghana's Data Protection Act. Signed-in customers are asked about cookies once per account, not once per browser, and rejecting is as easy as accepting. Customers can export their data or delete their account. Visits are counted by the store itself, as daily totals per page, source, and device, with no IP addresses, no cookies, and nothing tied to a person.

## The hard parts

- **Payments that went missing.** Writing tests for checkout turned up two ways a paid order could go wrong. A customer who opened the payment page twice and paid on the first one was charged, but the order stayed unpaid. And a customer whose browser got back from Paystack before Paystack's own notification was marked paid, but never got a confirmation email or text. Payments are now matched to their order either way, and whichever confirmation arrives first does the whole job. The same tests caught two people being able to buy the last item at once, and they now run on every change against a throwaway database.
- **The total shown wasn't always the total charged.** Checkout worked out tax, store credit and loyalty points with its own copy of the server's maths, and the copy had drifted. A customer using fewer points than the minimum saw a discount the server never gave, and one order showed as free but was charged GH₵9. The maths now lives in one shared file, checkout shows that file's result, and a check fails within a day if the storefront's copy ever differs from the server's.
- **Sign-in across two domains.** The storefront and the API ran on separate domains, so browsers treated the login cookie as third-party and dropped it. Nobody could stay signed in in production. I routed the API through the storefront's own domain, which made the cookie first-party and fixed it.
- **The cedi sign cost 83 KB.** Every price on the site pulled in a whole extra font file just for the "₵" character. The fonts are now self-hosted with a 1.5 KB file holding only the cedi sign. Together with lighter images and scripts that load only where they're needed, the first paint on a slow phone connection went from 5.9 to 3.0 seconds.
- **A domain the store doesn't own.** When one build setting was missing, links fell back to urbanpulse.com, which belongs to someone else. On the live site, every page's canonical link and share buttons pointed there, and receipts named another domain the store never registered. Addresses now come from one helper that falls back to wherever the site is actually served. For the same reason, emails no longer come from a made-up sender address that mail providers flag as spoofed.
- **Nothing made up.** I replaced every placeholder: the About story, FAQ answers rewritten to match what the store actually does, a promo box suggesting a code that didn't exist, and loyalty perks that were never built. Receipts once printed "VAT (12.5%)" as fixed text. They now work out the rate each order was actually charged.

## Stack

- **Storefront:** React, Vite, Tailwind CSS, TanStack Query, Zustand, Framer Motion, and an installable PWA.
- **API:** Node.js and Express on PostgreSQL, Paystack for payments, Cloudinary for images, email and SMS notifications, PDF receipts, TOTP two-factor sign-in, and Sentry for errors.
