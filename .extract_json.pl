use strict; use warnings; use JSON::PP;
my %s;
open my $m, q{.shared.tsv} or die $!;
while(<$m>){ chomp; my ($i,$t)=split(/\t/, $_,2); $s{$i}=$t; }
undef $/; open my $f, q{.sheet1.xml} or die $!; my $xml = <$f>;
my @rows = ($xml =~ m{<row [^>]*?>(.*?)</row>}sg);
my @out;
for my $i (1..$#rows){
  my $r=$rows[$i];
  my ($b) = $r =~ m{<c r=\"B\d+\"[^>]*><v>(\d+)</v>}s; # title index
  my ($c) = $r =~ m{<c r=\"C\d+\"[^>]*><v>(\d+)</v>}s; # artist index
  my ($d) = $r =~ m{<c r=\"D\d+\"[^>]*><v>(\d+)</v>}s; # link index
  next unless defined $b && defined $c; # need title & artist
  my $title = $s{$b}//''; my $artist = $s{$c}//''; my $link = defined $d ? ($s{$d}//'') : '';
  next unless length $title && length $artist;
  push @out, { title=>$title, artist=>$artist, link=>$link };
}
open my $o, q{> songs-2025.json} or die $!;
print $o JSON::PP->new->encode(\@out);
