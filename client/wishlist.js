// client/wishlist.js
document.addEventListener("DOMContentLoaded", async () => {
  const wishlistContainer = document.getElementById("wishlistItems");

  try {
    const res = await fetch("/api/wishlist", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Could not load wishlist.");
      return;
    }

    const products = await res.json();

    if (products.length === 0) {
      wishlistContainer.innerHTML = "<p>Your wishlist is empty.</p>";
      return;
    }

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";

      const img = document.createElement("img");
      img.src = `/image_products/${product.image}`;
      img.alt = product.name;

      const name = document.createElement("h3");
      name.textContent = product.name;

      const price = document.createElement("p");
      price.textContent = `${product.price} kr`;

      const heartIcon = document.createElement("span");
      heartIcon.className = "heart-icon";
      heartIcon.innerHTML = product.hjärta === "on" ? "❤️" : "🤍";

      heartIcon.addEventListener("click", async () => {
        const toggleRes = await fetch(`/api/products/${product._id}/heart`, {
          method: "PATCH",
          credentials: "include",
        });

        if (toggleRes.ok) {
          product.hjärta = product.hjärta === "on" ? "off" : "on";
          heartIcon.innerHTML = product.hjärta === "on" ? "❤️" : "🤍";
          if (product.hjärta === "off") {
            card.remove(); // Ta bort från vyn om borttagen från wishlist
          }
        } else {
          const errorData = await toggleRes.json();
          alert(errorData.message || "Could not update wishlist.");
        }
      });

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(heartIcon);
      wishlistContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading wishlist:", err);
    wishlistContainer.innerHTML = "<p>Something went wrong while loading your wishlist.</p>";
  }
});
