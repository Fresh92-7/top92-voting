use JSON::PP; 
my $j=JSON::PP->new->decode(do{local $/; open my $f, q{songs-2025.json}; <$f>}); 
open my $o, q{> songs-2025.js}; 
print $o "window.SONGS_2025 = [\n"; 
for my $i (0..$#$j){ 
  my $r=$j->[$i]; 
  my $t=$r->{title}//""; my $a=$r->{artist}//""; my $l=$r->{link}//""; 
  my ($sp,$yt,$sc)=("", "", ""); 
  # If cell contains a full iframe, extract src URL
  if ($l =~ /<iframe/i && $l =~ /src=\"([^\"]+)/i) { $l = $1; }
  if($l =~ /spotify\.com/){$sp=$l} elsif($l =~ /youtu(\.be|be\.com)/){$yt=$l} elsif($l =~ /soundcloud\.com/){$sc=$l} 
  $t =~ s/"/\\\"/g; $a =~ s/"/\\\"/g; 
  my $line = sprintf("  { title: \"%s\", artist: \"%s\"%s%s%s }%s\n", $t, $a, $sp?", spotify: \"$sp\"":"", $yt?", youtube: \"$yt\"":"", $sc?", soundcloud: \"$sc\"":"", ($i==$#$j?"":",")); 
  print $o $line 
} 
print $o "]\n"; 
