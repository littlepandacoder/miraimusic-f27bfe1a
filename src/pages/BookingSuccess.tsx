import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const BookingSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="w-24 h-24 text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Booking Confirmed!</h1>
        <p className="text-white/70 text-lg mb-8">
          Thank you for booking your piano class. You will receive a confirmation email with all the details shortly.
        </p>
        <div className="space-y-4">
          <Link to="/book-class">
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
              Book Another Class
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
