"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/cat/SearchBar";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

interface Property {
  id: string;
  location: string;
  housingClass: string;
  floorArea: number;
  costPerM2: number;
  tiv: number;
  hazardScore: number;
  estimatedLoss: number;
}

const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    location: "Kayole, Nairobi",
    housingClass: "Informal Iron Sheet",
    floorArea: 45,
    costPerM2: 15000,
    tiv: 675000,
    hazardScore: 0.85,
    estimatedLoss: 573750,
  },
  {
    id: "2",
    location: "Mathare, Nairobi",
    housingClass: "Semi-Permanent",
    floorArea: 60,
    costPerM2: 25000,
    tiv: 1500000,
    hazardScore: 0.72,
    estimatedLoss: 720000,
  },
  {
    id: "3",
    location: "Dandora, Nairobi",
    housingClass: "Permanent Masonry",
    floorArea: 80,
    costPerM2: 35000,
    tiv: 2800000,
    hazardScore: 0.45,
    estimatedLoss: 420000,
  },
  {
    id: "4",
    location: "Westlands, Nairobi",
    housingClass: "Concrete RCC",
    floorArea: 120,
    costPerM2: 50000,
    tiv: 6000000,
    hazardScore: 0.25,
    estimatedLoss: 300000,
  },
  {
    id: "5",
    location: "Kibera, Nairobi",
    housingClass: "Informal Iron Sheet",
    floorArea: 35,
    costPerM2: 12000,
    tiv: 420000,
    hazardScore: 0.92,
    estimatedLoss: 386400,
  },
];

export function PropertyTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [properties] = useState<Property[]>(MOCK_PROPERTIES);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredProperties = properties.filter(
    (prop) =>
      prop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.housingClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { label: "High", color: "bg-red-100 text-red-700" };
    if (score >= 0.4) return { label: "Medium", color: "bg-amber-100 text-amber-700" };
    return { label: "Low", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search properties by location or type..."
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-[#D21245] hover:bg-[#B50F3B]">
            <Plus className="size-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Housing Class</TableHead>
                <TableHead className="text-right">Floor Area (m²)</TableHead>
                <TableHead className="text-right">TIV (KES)</TableHead>
                <TableHead className="text-center">Risk Level</TableHead>
                <TableHead className="text-right">Est. Loss</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No properties found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProperties.map((property) => {
                  const risk = getRiskLevel(property.hazardScore);
                  return (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.location}</TableCell>
                      <TableCell>{property.housingClass}</TableCell>
                      <TableCell className="text-right">{property.floorArea}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(property.tiv)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={risk.color}>{risk.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatCurrency(property.estimatedLoss)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProperties.length)} of {filteredProperties.length} properties
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className={currentPage === pageNum ? "bg-[#00264D] hover:bg-[#00264D]/90" : ""}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
