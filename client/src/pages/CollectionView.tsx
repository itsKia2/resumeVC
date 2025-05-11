import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CollectionView() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Your Resume Collections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold">Software Engineer</h3>
            <p className="text-sm text-gray-600">3 versions</p>
            <Button className="mt-2">View</Button>
          </CardContent>
        </Card>
        {/* Repeat for mock data or loop through fetched resumes */}
      </div>
    </div>
  );
}
