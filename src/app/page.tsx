'use client'

import { useState, useEffect } from 'react';
import { isUserLoggedIn } from './utils/auth';
import Image from 'next/image';
import { Menu, X, ShoppingCart, Leaf, Truck, Droplets, Users, Phone, Mail, MapPin, ArrowRight, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AccountDropdown from './AccountDropdown';

// Product Type Based on The SQL Schema
type Product = {
  product_id: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  price: number;
  unit: string;
  emoji: string | null;
  gradient_class: string | null;
  rating: number;
};

export default function GreenSproutLanding() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [ products, setProducts] = useState<Product[]>([]); // products variable to hold DB data
  // Fetch Products from DB
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://localhost:4000/api/products'); // Product API endpoint
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    fetchProducts();
  }, []);
  
  
  const services = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Bulk Crop Supply',
      description: 'Large orders of potatoes, melons, and squash for retailers and markets.'
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: 'Irrigation Services',
      description: 'Professional irrigation system setup and valve installation.'
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Farm Consultancy',
      description: 'Expert advice on sustainable farming practices and crop management.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Support',
      description: 'Working with local farmers to build sustainable agricultural networks.'
    }
  ];
  // TODO: This is a feature to be implemented 2nd
  const addToCart = (productName: string) => {
    setCartCount(cartCount + 1);
    alert(`${productName} added to cart!\n\n(Shopping cart feature coming in next phase)`);
  };
  const handleViewProducts = () => {
    if (isUserLoggedIn()) {
      router.push('/products'); // if the user is logged in
    } else {
      // include a `next` query so user returns to products after login
      router.push(`/login?next=${encodeURIComponent('/products')}`);
    }
  };
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleContactSubmit = () => {
    alert('Message sent! We will get back to you soon.\n\n(Backend integration coming next)');
  };

  const handleNewsletterSubmit = () => {
    alert('Thank you for subscribing!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <Image
                src="/logo.png"
                alt="Selokong Farms Logo"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full shadow-lg transform hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Selokong Farms</h1>
                <p className="text-xs text-green-700 font-medium">Poultry & Horticulture</p>
              </div>
            </div>

            {/* Desktop Navigation */}
<nav className="hidden md:flex items-center gap-8 relative">
  <button
    onClick={() => scrollToSection("hero")}
    className="text-gray-700 hover:text-green-700 font-medium transition-colors"
  >
    Home
  </button>
  <button
    onClick={() => scrollToSection("about")}
    className="text-gray-700 hover:text-green-700 font-medium transition-colors"
  >
    About
  </button>
  <button
    onClick={() => scrollToSection("products")}
    className="text-gray-700 hover:text-green-700 font-medium transition-colors"
  >
    Products
  </button>
  <button
    onClick={() => scrollToSection("services")}
    className="text-gray-700 hover:text-green-700 font-medium transition-colors"
  >
    Services
  </button>
  <button
    onClick={() => scrollToSection("contact")}
    className="text-gray-700 hover:text-green-700 font-medium transition-colors"
  >
    Contact
  </button>

  {/* Account Dropdown */}
  <AccountDropdown />

  {/* Cart Button */}
  <button className="relative p-2 hover:bg-green-50 rounded-full transition-colors">
    <ShoppingCart className="w-6 h-6 text-gray-700" />
    {cartCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
        {cartCount}
      </span>
    )}
  </button>
</nav>


            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('hero')} className="block w-full text-left py-2 text-gray-700 hover:text-green-700 font-medium">Home</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left py-2 text-gray-700 hover:text-green-700 font-medium">About</button>
              <button onClick={() => scrollToSection('products')} className="block w-full text-left py-2 text-gray-700 hover:text-green-700 font-medium">Products</button>
              <button onClick={() => scrollToSection('services')} className="block w-full text-left py-2 text-gray-700 hover:text-green-700 font-medium">Services</button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left py-2 text-gray-700 hover:text-green-700 font-medium">Contact</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div>
              <div className="inline-block mb-4">
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                  🌱 Sustainably Grown, Locally Trusted
                </span>
              </div>
              <h2 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Fresh from our{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">
                  fields
                </span>{' '}
                to your table
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Premium quality produce grown with care on sustainable land. Browse our products, place orders, or contact us for farm services and bulk supply.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollToSection('products')}
                  className="group bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Shop Products
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="border-2 border-green-700 text-green-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-50 transition-all"
                >
                  Get in Touch
                </button>
              </div>
            
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-green-700">500+</div> /* Add a variable to be edited by the Admin */
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-700">100%</div>
                  <div className="text-sm text-gray-600">Local</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-700">24/7</div> /* Probably should be removed */
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Image
                  src="/farm-image.jpg"
                  alt="Farm produce"
                  width={400}
                  height={384}
                  className="w-full h-96 object-cover rounded-2xl"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              About Selokong Farms
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Committed to sustainable agriculture and delivering the highest quality produce to our community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Sustainable</h4>
              <p className="text-gray-700">
                We use eco-friendly farming practices including mixed crop rotations, natural compost, and careful water management.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Quality</h4>
              <p className="text-gray-700">
                Premium certified produce that meets the highest standards. Every crop is carefully monitored and harvested at peak freshness.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Community</h4>
              <p className="text-gray-700">
                Supporting local markets and building strong relationships with our customers and fellow farmers in the region.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-12 text-white shadow-2xl">
            <div className="max-w-3xl mx-auto text-center">
              <h4 className="text-3xl font-bold mb-4">Our Mission</h4>
              <p className="text-lg leading-relaxed opacity-95">
                Located in Malotwana, Selokong Farms specializes in potatoes, watermelons, and butternut squash. 
                We supply local markets and accept orders for bulk delivery, always maintaining our commitment to sustainable farming 
                that respects the land and produces food you can trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-gradient-to-br from-amber-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Featured Products
            </h3>
            <p className="text-xl text-gray-600">
              Fresh, quality produce from our sustainable farm
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.product_id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                <div className={`h-56 bg-gradient-to-br ${product.gradient_class} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="text-8xl relative z-10 transform hover:scale-110 transition-transform">
                    {product.emoji}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-2xl font-bold text-gray-900">{product.name}</h4>
                    <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-700">{product.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{product.short_description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold text-green-700">P{product.price}</span>
                      <span className="text-gray-500 ml-2">/ {product.unit}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => addToCart(product.name)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-10 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2"
              onClick={handleViewProducts}
            >
              View All Products
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Services
            </h3>
            <p className="text-xl text-gray-600">
              Comprehensive agricultural solutions for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="group bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform shadow-lg">
                  {service.icon}
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h4>
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-green-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                Get in Touch
              </h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-700">+267 74 022 980</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-700">selokongfarms@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">Location</h4>
                    <p className="text-gray-700">A1-Malotwana Road<br />Gaborone, Botswana <br /> <a href="https://maps.app.goo.gl/csVqCa7CfWMiYnEF6" ><strong>Click here</strong></a> for google Maps location</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-2xl text-white shadow-xl">
                <h4 className="text-2xl font-bold mb-4">Visit Hours</h4>
                <div className="space-y-2">
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 8:00 AM - 1:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-2xl">
                <h4 className="text-3xl font-bold text-gray-900 mb-8">Send us a Message</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Name *</label>
                    <input 
                      type="text" 
                      className="w-full border-2 text-gray-500 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email or Phone *</label>
                    <input 
                      type="text" 
                      className="w-full border-2 text-gray-500 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                    <input 
                      type="text" 
                      className="w-full border-2 text-gray-500 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message *</label>
                    <textarea 
                      rows={5}
                      className="w-full border-2 text-gray-500 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us what you need..."
                    />
                  </div>

                  <button 
                    onClick={handleContactSubmit}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                src="/logo.png"
                alt="Selokong Farms Logo"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full shadow-lg transform hover:scale-105 transition-transform"
              />
                <h3 className="text-2xl font-bold">Selokong Farms</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Sustainably grown, locally trusted. Providing quality produce to our community with care for the environment.
              </p>
              <div className="flex gap-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
                  <a className="facebook" href="#">
                    <span></span>
                     <span></span>
                     <span></span>
                    <span></span>
                    <i className="fa fa-facebook" aria-hidden="true"></i>
                  </a>
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
                 <a className="twitter" href="#">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <i className="fa fa-twitter" aria-hidden="true"></i>
                  </a>
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
                  <a className="instagram" href="#">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <i className="fa fa-instagram" aria-hidden="true"></i>
                  </a>
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('hero')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => scrollToSection('products')} className="hover:text-white transition-colors">Products</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Services</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Newsletter</h4>
              <p className="text-gray-400 text-sm mb-4">Stay updated on new products!</p>
              <div className="flex flex-col gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-green-500"
                />
                <button 
                  onClick={handleNewsletterSubmit}
                  className="bg-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2025 Selokong Farms. All rights reserved.</p>
            <p>Built with care for sustainable agriculture 🌾</p>
          </div>
        </div>
      </footer>
    </div>
  );
}