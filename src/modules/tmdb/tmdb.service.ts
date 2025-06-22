import { Injectable, NotFoundException } from '@nestjs/common';
import { GetMovieResponseDTO } from '../movie/dto/get-movie.dto';
import { TMDB, Movie, Video, Configuration, ReleaseDateResult } from 'tmdb-ts';

@Injectable()
export class TmdbService {
  private readonly tmdb: TMDB;

  constructor() {
    const apiKey = process.env.TMDB_API_KEY;
    this.tmdb = new TMDB(apiKey ?? '');
  }

  async getMovieByTitleAndYear(
    title: string,
    year: number,
  ): Promise<GetMovieResponseDTO> {
    const movie = await this.getMovie(title, year);

    const [details, config, releaseDates] = await Promise.all([
      this.tmdb.movies.details(movie.id, ['credits', 'videos'], 'uk-UA'),
      this.tmdb.configuration.getApiConfiguration(),
      this.tmdb.movies.releaseDates(movie.id),
    ]);

    const movieDTO = new GetMovieResponseDTO();
    movieDTO.name = details.title;
    movieDTO.description = details.overview;
    movieDTO.duration = details.runtime;
    movieDTO.year = year;
    movieDTO.ageRate =
      this.extractAgeRatingFromReleaseDates(
        releaseDates.results,
        'UA',
        details.adult,
      ) ?? '';
    movieDTO.rating = parseFloat(details.vote_average.toFixed(1));
    movieDTO.posterUrl = this.getPosterUrl(details.poster_path, config) ?? '';
    movieDTO.trailerUrl = this.getTrailerUrl(details.videos.results) ?? '';
    movieDTO.genres = details.genres.map((g) => g.name);
    movieDTO.directors = details.credits.crew
      .filter((p) => p.job === 'Director')
      .map((p) => p.name);
    movieDTO.actors = details.credits.cast.slice(0, 5).map((p) => p.name);
    movieDTO.studios = details.production_companies.map((c) => c.name);

    return movieDTO;
  }

  private async getMovie(title: string, year: number): Promise<Movie> {
    const searchResults = await this.tmdb.search.movies({
      query: title,
      primary_release_year: year,
      include_adult: true,
      language: 'uk-UA',
    });

    if (!searchResults.results || searchResults.results.length === 0) {
      throw new NotFoundException('Фільм не знайдено');
    }

    const exactMatch = searchResults.results.find(
      (m) => m.title.toLowerCase() === title.toLowerCase(),
    );

    if (!exactMatch) {
      throw new NotFoundException('Фільм не знайдено');
    }

    return exactMatch;
  }

  private getTrailerUrl(videos: Array<Video>): string | null {
    const trailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer',
    );
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  }

  private getPosterUrl(
    posterPath: string | undefined,
    config: Configuration,
  ): string | null {
    if (!posterPath) return null;
    return `${config.images.secure_base_url}original${posterPath}`;
  }

  private extractAgeRatingFromReleaseDates(
    releaseDates: Array<ReleaseDateResult>,
    countryCode = 'UA',
    fallbackAdult: boolean = false,
  ): string | null {
    const countryRelease = releaseDates.find(
      (r) => r.iso_3166_1 === countryCode,
    );
    if (countryRelease) {
      const cert = countryRelease.release_dates.find(
        (rd) => rd.certification && rd.certification.trim() !== '',
      );
      if (cert) return cert.certification;
    }

    return fallbackAdult ? '18+' : '0+';
  }
}
