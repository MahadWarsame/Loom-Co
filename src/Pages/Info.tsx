import { Link, useParams } from "react-router-dom";

const pages = {
  delivery: {
    title: "Delivery",
    intro: "We want your rug to arrive safely, securely and without unnecessary waiting.",
    sections: [
      ["Processing", "Orders are prepared as quickly as possible. Once your order has been dispatched, you will receive delivery and tracking information by email when available."],
      ["Delivery in Sweden", "Delivery times and available shipping methods are shown at checkout based on your order and delivery address. Larger rugs may be delivered rolled or carefully folded depending on the carrier and size."],
      ["Packaging", "Rugs are packed securely to protect them during transport. When a rug arrives folded or rolled, allow it some time to relax and flatten naturally before use."],
      ["Tracking", "If tracking is available for your shipment, we will send the tracking details once the order has left our fulfilment process."],
    ],
  },
  returns: {
    title: "Returns",
    intro: "Choosing the right rug is personal. If your purchase is not right for your home, contact us before sending it back.",
    sections: [
      ["Return period", "You may request a return within 30 days of receiving your order, provided the product meets the applicable return conditions."],
      ["Condition", "Please return the rug unused and in its original condition, with the packaging kept as intact as reasonably possible. Rugs should be protected carefully during return transport."],
      ["How to start", "Contact our support team with your order number and the item you would like to return. We will provide the next steps and return instructions."],
      ["Refunds", "Once the returned item has been received and inspected, the refund will be processed to the original payment method in accordance with the applicable consumer rules."],
    ],
  },
  contact: {
    title: "Contact",
    intro: "Need help choosing a size, understanding a material or checking an order? We are happy to help.",
    sections: [
      ["Customer support", "For questions about products, orders, delivery or returns, please contact Loom & Co through the support details provided at checkout or in your order confirmation."],
      ["Product advice", "If you are unsure about a rug's size, material, colour or placement, tell us about your room and what you are looking for. We can help you narrow down suitable options."],
      ["Order questions", "When contacting us about an existing order, include your order number so we can find the relevant details quickly."],
    ],
  },
  story: {
    title: "Our story",
    intro: "Loom & Co was created around a simple idea: a rug should do more than fill an empty space — it should help make a room feel like home.",
    sections: [
      ["A considered collection", "We focus on rugs with character, texture and a sense of place, from timeless traditional patterns to modern designs that work naturally in Scandinavian interiors."],
      ["Made for real homes", "Our collection is selected with everyday living in mind. We look for pieces that balance visual character with practical details such as size, material and care requirements."],
      ["Simple, thoughtful shopping", "We believe buying a rug should feel straightforward. Clear product information, available sizes and practical care guidance should help you make a confident choice before ordering."],
    ],
  },
  care: {
    title: "Care guide",
    intro: "Good care helps your rug keep its colour, texture and character for longer.",
    sections: [
      ["Regular cleaning", "Vacuum regularly using a suitable rug setting and avoid excessive suction, especially on delicate or high-pile rugs. Follow the care instructions for the specific material."],
      ["Spills", "Act quickly. Gently blot the spill with a clean, absorbent cloth rather than rubbing it into the fibres. Work from the outside toward the centre of the stain."],
      ["Deep cleaning", "Cleaning requirements vary by material. Delicate rugs, including some viscose and silk-like fibres, may require professional rug cleaning. Do not use water or cleaning products unless the product's care instructions allow it."],
      ["Placement", "Use a suitable rug pad where appropriate to reduce movement and help protect both the rug and the floor. Rotate the rug periodically to distribute everyday wear."],
    ],
  },
} as const;

export function InfoPage() {
  const { page } = useParams();
  const content = page && page in pages ? pages[page as keyof typeof pages] : null;

  if (!content) {
    return <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8"><h1 className="text-4xl">Page not found</h1><Link to="/" className="mt-6 inline-block underline">Back to home</Link></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-24">
      <Link to="/" className="text-xs font-semibold uppercase tracking-[0.16em] text-mut hover:text-fg">Loom &amp; Co</Link>
      <h1 className="mt-5 text-4xl leading-tight sm:text-6xl">{content.title}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-mut">{content.intro}</p>
      <div className="mt-14 divide-y divide-line border-y border-line">
        {content.sections.map(([heading, body]) => (
          <section key={heading} className="py-8">
            <h2 className="text-lg font-semibold">{heading}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-mut">{body}</p>
          </section>
        ))}
      </div>
      <div className="mt-12">
        <Link to="/shop" className="inline-flex bg-fg px-6 py-3 text-sm font-semibold text-bg hover:bg-[#3a3731]">Shop rugs</Link>
      </div>
    </div>
  );
}
