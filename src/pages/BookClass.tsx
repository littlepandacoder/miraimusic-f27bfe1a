import { useState } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Calendar as CalendarIcon, ShoppingCart, Music, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const BookClass = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const pricePerClass = 35;
  const totalPrice = pricePerClass * quantity;

  const handleCheckout = async () => {
    if (!selectedDate || !selectedTime || !customerName || !customerEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-booking-checkout", {
        body: {
          customerName,
          customerEmail,
          scheduledDate: format(selectedDate, "yyyy-MM-dd"),
          scheduledTime: selectedTime,
          quantity,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to create checkout session");
    } finally {
      setIsLoading(false);
    }
  };

  const disabledDays = (date: Date) => {
    return isBefore(date, startOfToday());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Book Your Piano <span className="text-purple-400">Class</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Schedule a 45-minute one-on-one piano lesson with our expert instructors
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Date Selection */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                Select Date
              </CardTitle>
              <CardDescription className="text-white/60">
                Choose your preferred lesson date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                className="rounded-md border border-white/20 bg-white/5 text-white pointer-events-auto [&_.rdp-day]:text-white [&_.rdp-day_button:hover]:bg-purple-500/30 [&_.rdp-day_button.rdp-day_selected]:bg-purple-500"
              />
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Select Time
              </CardTitle>
              <CardDescription className="text-white/60">
                45-minute session times available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`${
                      selectedTime === time
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cart & Checkout */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-400" />
                Your Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-white/70">Your Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Email</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Number of Classes</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      -
                    </Button>
                    <span className="text-white text-lg font-semibold w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-4 space-y-2">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Music className="w-8 h-8 text-purple-400" />
                  <div className="flex-1">
                    <p className="text-white font-medium">Piano Class (45 min)</p>
                    <p className="text-white/60 text-sm">
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"} at {selectedTime || "Select time"}
                    </p>
                  </div>
                  <p className="text-white font-semibold">${pricePerClass}</p>
                </div>

                <div className="flex justify-between items-center text-white pt-2">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between items-center text-white text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-purple-400">${totalPrice}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isLoading || !selectedDate || !selectedTime || !customerName || !customerEmail}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-6 text-lg"
              >
                {isLoading ? "Processing..." : `Checkout - $${totalPrice}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookClass;
